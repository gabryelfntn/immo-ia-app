import type { SupabaseClient } from "@supabase/supabase-js";
import { buildMatchingUserPrompt } from "@/lib/matching/build-prompt";
import { callClaudeForMatching } from "@/lib/matching/anthropic";
import { parseMatchesJson } from "@/lib/matching/parse-matches";
import { formatPriceEUR } from "@/lib/properties/labels";

export type MatchOutputItem = {
  propertyId: string;
  score: number;
  reason: string;
  property: {
    id: string;
    title: string;
    price: number;
    priceLabel: string;
    surface: number;
    city: string;
    transaction: string;
    image_url: string | null;
  };
};

export async function runMatchForContact(
  supabase: SupabaseClient,
  agencyId: string,
  contactId: string
): Promise<
  | { ok: true; matches: MatchOutputItem[] }
  | { ok: false; error: string; status?: number }
> {
  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .eq("agency_id", agencyId)
    .maybeSingle();

  if (contactError) {
    return { ok: false, error: contactError.message, status: 500 };
  }
  if (!contact) {
    return { ok: false, error: "Contact introuvable.", status: 404 };
  }

  const { data: properties, error: propError } = await supabase
    .from("properties")
    .select(
      "id, title, type, transaction, price, surface, rooms, bedrooms, city, zip_code, address, description, image_url"
    )
    .eq("agency_id", agencyId)
    .eq("status", "disponible");

  if (propError) {
    return { ok: false, error: propError.message, status: 500 };
  }

  const propList = properties ?? [];
  if (propList.length === 0) {
    return { ok: true, matches: [] };
  }

  const forPrompt = propList.map((p) => ({
    id: p.id as string,
    title: p.title as string,
    type: p.type as string,
    transaction: p.transaction as string,
    price: Number(p.price),
    surface: Number(p.surface),
    rooms: Number(p.rooms),
    bedrooms: Number(p.bedrooms),
    city: p.city as string,
    zip_code: p.zip_code as string,
    address: p.address as string,
    description: (p.description as string | null) ?? null,
    image_url:
      typeof p.image_url === "string" && p.image_url.trim()
        ? p.image_url.trim()
        : null,
  }));

  const allowedIds = new Set(forPrompt.map((p) => p.id));

  const userPrompt = buildMatchingUserPrompt(
    {
      first_name: contact.first_name as string,
      last_name: contact.last_name as string,
      type: contact.type as string,
      status: contact.status as string,
      budget_min:
        contact.budget_min != null ? Number(contact.budget_min) : null,
      budget_max:
        contact.budget_max != null ? Number(contact.budget_max) : null,
      desired_city:
        typeof contact.desired_city === "string"
          ? contact.desired_city
          : null,
      notes: typeof contact.notes === "string" ? contact.notes : null,
    },
    forPrompt
  );

  let assistantText: string;
  try {
    assistantText = await callClaudeForMatching(userPrompt);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Échec de l’appel IA.";
    return { ok: false, error: message, status: 502 };
  }

  let rawMatches;
  try {
    rawMatches = parseMatchesJson(assistantText);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Impossible de lire la réponse du modèle.";
    return { ok: false, error: message, status: 502 };
  }

  const seen = new Set<string>();
  const filtered = rawMatches.filter((m) => {
    if (!allowedIds.has(m.propertyId)) return false;
    if (seen.has(m.propertyId)) return false;
    seen.add(m.propertyId);
    return true;
  });

  const byId = new Map(forPrompt.map((p) => [p.id, p]));

  const matches: MatchOutputItem[] = filtered.map((m) => {
    const p = byId.get(m.propertyId)!;
    const transaction = p.transaction as "vente" | "location";
    return {
      propertyId: m.propertyId,
      score: Math.round(m.score * 10) / 10,
      reason: m.reason.trim(),
      property: {
        id: p.id,
        title: p.title,
        price: p.price,
        priceLabel: formatPriceEUR(p.price, transaction),
        surface: p.surface,
        city: p.city,
        transaction: p.transaction,
        image_url: p.image_url ?? null,
      },
    };
  });

  return { ok: true, matches };
}
