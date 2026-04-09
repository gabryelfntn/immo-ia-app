import { createClient } from "@/lib/supabase/server";
import { callClaudeForListings } from "@/lib/listings/anthropic";
import { parseListingsJson } from "@/lib/listings/parse-response";
import {
  buildPropertyListingUserPrompt,
  type PropertyRowForListing,
} from "@/lib/listings/property-prompt";
import { z } from "zod";

const bodySchema = z.object({
  propertyId: z.string().uuid("Identifiant de bien invalide."),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.propertyId?.[0] ?? "Requête invalide.";
    return Response.json({ error: msg }, { status: 400 });
  }

  const { propertyId } = parsed.data;

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

  const { data: property, error: propError } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .eq("agency_id", profile.agency_id)
    .maybeSingle();

  if (propError) {
    return Response.json({ error: propError.message }, { status: 500 });
  }

  if (!property) {
    return Response.json({ error: "Bien introuvable." }, { status: 404 });
  }

  const row = property as unknown as PropertyRowForListing;
  const userPrompt = buildPropertyListingUserPrompt(row);

  let assistantText: string;
  try {
    assistantText = await callClaudeForListings(userPrompt);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Échec de l’appel IA.";
    return Response.json({ error: message }, { status: 502 });
  }

  let listings;
  try {
    listings = parseListingsJson(assistantText);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Impossible de lire la réponse du modèle.";
    return Response.json({ error: message }, { status: 502 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("generated_listings")
    .insert({
      property_id: propertyId,
      agency_id: profile.agency_id,
      classique: listings.classique,
      dynamique: listings.dynamique,
      premium: listings.premium,
    })
    .select("id, classique, dynamique, premium, created_at")
    .single();

  if (insertError || !inserted) {
    return Response.json(
      { error: insertError?.message ?? "Enregistrement impossible." },
      { status: 500 }
    );
  }

  return Response.json({
    classique: inserted.classique,
    dynamique: inserted.dynamique,
    premium: inserted.premium,
    id: inserted.id,
    created_at: inserted.created_at,
  });
}
