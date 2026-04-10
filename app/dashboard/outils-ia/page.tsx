import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OutilsIaClient } from "./outils-ia-client";

export default async function OutilsIaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900">Outils IA</h1>
        <p className="mt-2 text-sm text-stone-600">
          Aucune agence associée à votre compte.
        </p>
      </div>
    );
  }

  const agencyId = profile.agency_id as string;

  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, title, city")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900">Outils IA</h1>
        <p className="mt-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-800">
          {error.message}
        </p>
      </div>
    );
  }

  return <OutilsIaClient properties={properties ?? []} />;
}
