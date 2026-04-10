"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  city_query: z.string().max(200).optional(),
  transaction: z.string().max(20).optional(),
  type_query: z.string().max(80).optional(),
  price_max: z.coerce.number().nonnegative().optional(),
  contact_id: z.string().uuid().optional(),
});

export type VeilleMutationResult = { ok: true } | { ok: false; error: string };

export async function createSavedSearch(input: unknown): Promise<VeilleMutationResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Données invalides." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Non authentifié." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return { ok: false, error: "Agence introuvable." };
  }

  const t = parsed.data.transaction?.trim();
  const tx =
    t === "vente" || t === "location" ? t : null;
  const { error } = await supabase.from("saved_property_searches").insert({
    agency_id: profile.agency_id,
    agent_id: user.id,
    name: parsed.data.name.trim(),
    city_query: parsed.data.city_query?.trim() || null,
    transaction: tx,
    type_query: parsed.data.type_query?.trim() || null,
    price_max: parsed.data.price_max ?? null,
    contact_id: parsed.data.contact_id ?? null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/veille");
  return { ok: true };
}

export async function deleteSavedSearch(id: string): Promise<VeilleMutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Non authentifié." };
  }

  const { error } = await supabase
    .from("saved_property_searches")
    .delete()
    .eq("id", id)
    .eq("agent_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/veille");
  return { ok: true };
}
