import { createClient } from "@/lib/supabase/server";
import { fetchDashboardData } from "@/lib/dashboard/fetch-dashboard-data";
import { normalizeRole, isAgentOnly } from "@/lib/auth/agency-scope";
import Link from "next/link";
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
    const noProfileRow = profile == null;
    return (
      <div className="max-w-xl space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Tableau de bord
        </h1>
        {noProfileRow ? (
          <p className="text-slate-600">
            Aucune ligne <code className="rounded bg-slate-100 px-1 text-sm">profiles</code>{" "}
            n’a été trouvée pour ton compte (ou la{" "}
            <strong className="font-semibold text-slate-800">RLS</strong> empêche la lecture).
            Ça arrive souvent après une inscription avec confirmation e-mail : l’étape « créer
            l’agence » n’a pas été exécutée, ou un trigger a créé un profil vide.
          </p>
        ) : (
          <p className="text-slate-600">
            Ton profil existe, mais{" "}
            <code className="rounded bg-slate-100 px-1 text-sm">profiles.agency_id</code> est
            vide. Sans agence liée, l’app ne peut pas charger biens et contacts.
          </p>
        )}
        <div className="rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-4">
          <p className="text-sm font-semibold text-slate-800">
            Solution la plus simple depuis l’app
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Crée l’agence et rattache ton profil en un formulaire.
          </p>
          <Link
            href="/dashboard/complete-agency"
            className="mt-3 inline-flex rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
          >
            Finaliser mon agence
          </Link>
        </div>
        <p className="text-sm text-slate-500">
          <strong className="text-slate-700">Si tes données sont déjà dans Supabase</strong>{" "}
          (biens, contacts) sous une agence existante, ne crée pas une deuxième agence : dans le{" "}
          <strong>SQL Editor</strong>, mets à jour{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">profiles.agency_id</code> avec
          l’UUID de cette agence (voir le fichier{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">
            supabase/manual/repair_profiles_agency_id.sql
          </code>
          ).
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
