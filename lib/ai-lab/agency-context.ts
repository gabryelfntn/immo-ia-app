import type { SupabaseClient } from "@supabase/supabase-js";

export async function loadAgencyContextSnippet(
  supabase: SupabaseClient,
  agencyId: string
): Promise<string> {
  const [{ data: agency }, { count: nProps }, { count: nCont }] =
    await Promise.all([
      supabase.from("agencies").select("name").eq("id", agencyId).maybeSingle(),
      supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("agency_id", agencyId),
      supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("agency_id", agencyId),
    ]);

  const name = agency?.name?.trim() || "Agence";
  return `Agence : ${name}. Environ ${nProps ?? 0} biens, ${nCont ?? 0} contacts dans le CRM (ordres de grandeur).`;
}
