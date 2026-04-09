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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
          Tableau de bord
        </h1>
        <p className="mt-2 text-zinc-500">
          Aucune agence associée à votre compte.
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
