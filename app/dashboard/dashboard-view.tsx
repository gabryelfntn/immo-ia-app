import { createClient } from "@/lib/supabase/server";
import { fetchDashboardData } from "@/lib/dashboard/fetch-dashboard-data";
import { normalizeRole, isAgentOnly } from "@/lib/auth/agency-scope";
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
    .select("agency_id, role")
    .eq("id", user.id)
    .maybeSingle();

  const userRole = normalizeRole(
    profile?.role != null && profile.role !== ""
      ? String(profile.role)
      : null
  );

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

  const result = await fetchDashboardData(
    supabase,
    profile.agency_id,
    user.id
  );

  if (!result.ok) {
    const parts = [
      result.errors.properties
        ? `Biens : ${result.errors.properties}`
        : null,
      result.errors.contacts
        ? `Contacts : ${result.errors.contacts}`
        : null,
    ].filter(Boolean);
    return (
      <div className="max-w-2xl space-y-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-5 text-red-800">
        <p className="font-semibold">
          Impossible de charger les données du tableau de bord.
        </p>
        {parts.length > 0 ? (
          <ul className="list-inside list-disc text-sm">
            {parts.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : null}
        <p className="text-sm text-red-700/90">
          Si tu vois « permission », « policy » ou « RLS », exécute la migration
          SQL{" "}
          <code className="rounded bg-red-100/80 px-1 text-xs text-red-900">
            supabase/migrations/20260410140000_rls_core_tables_select.sql
          </code>{" "}
          dans le SQL Editor Supabase (politiques de lecture sur properties,
          contacts, etc.).
        </p>
      </div>
    );
  }

  const payload = result.data;

  const raw = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const todayLabel = raw.charAt(0).toUpperCase() + raw.slice(1);

  const agentEmptyHint =
    isAgentOnly(userRole) &&
    payload.recentProperties.length === 0 &&
    payload.recentContacts.length === 0
      ? "Compte agent : seuls les biens et contacts dont tu es le responsable (agent_id) apparaissent ici. Vérifie dans Supabase que tes lignes pointent bien vers ton id utilisateur, ou passe ton rôle en admin/manager pour voir toute l’agence."
      : null;

  const adminEmptyHint =
    !isAgentOnly(userRole) &&
    payload.recentProperties.length === 0 &&
    payload.recentContacts.length === 0
      ? "Aucun bien ni contact renvoyé pour ton agence : contrôle dans Supabase que properties.agency_id et contacts.agency_id correspondent exactement à ton profiles.agency_id. Si les données sont là mais toujours invisibles, exécute la migration SQL core_rls (lecture RLS) dans le SQL Editor."
      : null;

  return (
    <DashboardClient
      data={payload}
      todayLabel={todayLabel}
      dataLoadHint={agentEmptyHint ?? adminEmptyHint}
    />
  );
}
