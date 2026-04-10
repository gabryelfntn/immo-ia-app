import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AgencySessionOk = {
  ok: true;
  supabase: SupabaseClient;
  user: User;
  agencyId: string;
};

export type AgencySessionResult =
  | AgencySessionOk
  | { ok: false; response: Response };

export async function requireAgencySession(): Promise<AgencySessionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return {
      ok: false,
      response: Response.json({ error: "Non authentifié." }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return {
      ok: false,
      response: Response.json({ error: "Agence introuvable." }, { status: 403 }),
    };
  }

  return {
    ok: true,
    supabase,
    user,
    agencyId: profile.agency_id as string,
  };
}
