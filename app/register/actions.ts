"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CompleteRegistrationResult =
  | { ok: true }
  | { ok: false; error: string };

export async function completeRegistration(input: {
  agencyName: string;
  fullName: string;
  email: string;
}): Promise<CompleteRegistrationResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      error:
        "Session introuvable. Si la confirmation par email est activée, ouvrez le lien reçu puis reconnectez-vous.",
    };
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return { ok: true };
  }

  const { data: agency, error: agencyError } = await supabase
    .from("agencies")
    .insert({
      name: input.agencyName.trim(),
      email: input.email.trim(),
    })
    .select("id")
    .single();

  if (agencyError || !agency) {
    return {
      ok: false,
      error: agencyError?.message ?? "Impossible de créer l'agence.",
    };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    agency_id: agency.id,
    full_name: input.fullName.trim(),
    role: "admin",
  });

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
