import { createClient } from "@/lib/supabase/server";
import { fetchDashboardData } from "@/lib/dashboard/fetch-dashboard-data";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

export async function DashboardView() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return (
      <div className="max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Tableau de bord
        </h1>
        <p className="mt-2 text-slate-600">
          Aucune agence n’est liée à votre profil dans Supabase (
          <code className="rounded bg-slate-100 px-1 text-sm">profiles.agency_id</code>
          ). Les données existent souvent encore (biens, contacts) mais l’app ne peut pas
          les afficher sans cette liaison.
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Ouvre le{" "}
          <strong>SQL Editor</strong> Supabase, exécute le diagnostic dans{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">
            supabase/manual/repair_profiles_agency_id.sql
          </code>
          , puis mets à jour <code className="rounded bg-slate-100 px-1 text-xs">agency_id</code>{" "}
          sur ta ligne <code className="rounded bg-slate-100 px-1 text-xs">profiles</code> avec
          l’UUID de ton agence (table <code className="rounded bg-slate-100 px-1 text-xs">agencies</code>
          , ou le même <code className="rounded bg-slate-100 px-1 text-xs">agency_id</code> que sur un
          bien).
        </p>
      </div>
    );
  }

  const payload = await fetchDashboardData(
    supabase,
    profile.agency_id,
    user.id
  );

  if (!payload) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-red-700">
        Impossible de charger les statistiques. Vérifiez vos tables Supabase.
      </div>
    );
  }

  const raw = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const todayLabel = raw.charAt(0).toUpperCase() + raw.slice(1);

  return <DashboardClient data={payload} todayLabel={todayLabel} />;
}
