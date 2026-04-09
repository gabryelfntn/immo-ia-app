import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { callClaudeForFollowup } from "@/lib/followup/anthropic";
import { parseFollowupEmailJson } from "@/lib/followup/parse-response";
import {
  buildFollowupUserPrompt,
  type FollowupContact,
  type FollowupProperty,
} from "@/lib/followup/build-prompt";

const bodySchema = z.object({
  contactId: z.string().uuid("Identifiant de contact invalide."),
});

function pickSuggestedProperties(args: {
  properties: {
    id: string;
    title: string;
    transaction: string;
    type: string;
    price: number;
    surface: number;
    city: string;
  }[];
  desiredCity: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
}): FollowupProperty[] {
  const { properties, desiredCity, budgetMin, budgetMax } = args;
  const city = desiredCity?.trim().toLowerCase() || null;

  const scored = properties.map((p) => {
    let score = 0;
    if (city && p.city.toLowerCase().includes(city)) score += 3;
    if (budgetMin != null && p.price >= budgetMin) score += 1;
    if (budgetMax != null && p.price <= budgetMax) score += 3;
    if (budgetMax != null && budgetMin != null) {
      const mid = (budgetMin + budgetMax) / 2;
      const dist = Math.abs(p.price - mid);
      score += Math.max(0, 2 - dist / Math.max(1, mid) * 2);
    }
    return { p, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ p }) => ({
      id: p.id,
      title: p.title,
      transaction: (p.transaction === "location" ? "location" : "vente") as
        | "vente"
        | "location",
      type: p.type,
      price: p.price,
      surface: p.surface,
      city: p.city,
    }));
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors.contactId?.[0] ?? "Requête invalide.";
    return Response.json({ error: msg }, { status: 400 });
  }

  const { contactId } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.agency_id) {
    return Response.json({ error: "Agence introuvable." }, { status: 403 });
  }

  const agencyId = profile.agency_id as string;

  const { data: contactRow, error: contactError } = await supabase
    .from("contacts")
    .select(
      "first_name, last_name, email, status, type, budget_min, budget_max, desired_city, last_contacted_at, created_at"
    )
    .eq("id", contactId)
    .eq("agency_id", agencyId)
    .maybeSingle();

  if (contactError) {
    return Response.json({ error: contactError.message }, { status: 500 });
  }
  if (!contactRow) {
    return Response.json({ error: "Contact introuvable." }, { status: 404 });
  }

  const contact: FollowupContact = {
    first_name: contactRow.first_name as string,
    last_name: contactRow.last_name as string,
    email: contactRow.email as string,
    status: contactRow.status as string,
    type: contactRow.type as string,
    budget_min:
      contactRow.budget_min != null ? Number(contactRow.budget_min) : null,
    budget_max:
      contactRow.budget_max != null ? Number(contactRow.budget_max) : null,
    desired_city:
      typeof contactRow.desired_city === "string" ? contactRow.desired_city : null,
    last_contacted_at:
      typeof contactRow.last_contacted_at === "string"
        ? contactRow.last_contacted_at
        : null,
    created_at: contactRow.created_at as string,
  };

  const { data: props, error: propError } = await supabase
    .from("properties")
    .select("id, title, transaction, type, price, surface, city")
    .eq("agency_id", agencyId)
    .eq("status", "disponible")
    .limit(40);

  if (propError) {
    return Response.json({ error: propError.message }, { status: 500 });
  }

  const propertyList =
    (props ?? []).map((p) => ({
      id: p.id as string,
      title: p.title as string,
      transaction: p.transaction as string,
      type: p.type as string,
      price: Number(p.price),
      surface: Number(p.surface),
      city: p.city as string,
    })) ?? [];

  const suggested = pickSuggestedProperties({
    properties: propertyList,
    desiredCity: contact.desired_city,
    budgetMin: contact.budget_min,
    budgetMax: contact.budget_max,
  });

  const userPrompt = buildFollowupUserPrompt({
    contact,
    properties: suggested,
  });

  let assistantText: string;
  try {
    assistantText = await callClaudeForFollowup(userPrompt);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Échec de l’appel IA.";
    return Response.json({ error: message }, { status: 502 });
  }

  let email;
  try {
    email = parseFollowupEmailJson(assistantText);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Impossible de lire la réponse du modèle.";
    return Response.json({ error: message }, { status: 502 });
  }

  return Response.json({
    email,
    suggestedProperties: suggested,
  });
}

