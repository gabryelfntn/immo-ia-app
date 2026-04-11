import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole, canViewTeamPerformance } from "@/lib/auth/agency-scope";
import { Users } from "lucide-react";

export default async function EquipePerformancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Équipe</h1>
        <p className="mt-2 text-sm text-slate-500">Aucune agence associée.</p>
      </div>
    );
  }

  const role = normalizeRole(profile.role as string | null);
  if (!canViewTeamPerformance(role)) {
    redirect("/dashboard");
  }

  const agencyId = profile.agency_id as string;

  const [{ data: members }, { data: contacts }, { data: properties }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("agency_id", agencyId),
      supabase
        .from("contacts")
        .select("agent_id, status, pipeline_stage")
        .eq("agency_id", agencyId),
      supabase.from("properties").select("agent_id").eq("agency_id", agencyId),
    ]);

  const memberList = members ?? [];
  const contactRows = contacts ?? [];
  const propertyRows = properties ?? [];

  function countFor(agentId: string | null | undefined, rows: { agent_id?: string | null }[]) {
    if (!agentId) return 0;
    return rows.filter((r) => (r.agent_id as string | null) === agentId).length;
  }

  const hotPipeline = new Set(["offre", "signature", "visite"]);

  function priorityLeadsFor(
    agentId: string | null | undefined,
    rows: {
      agent_id?: string | null;
      status?: string | null;
      pipeline_stage?: string | null;
    }[]
  ): number {
    if (!agentId) return 0;
    return rows.filter((r) => {
      if ((r.agent_id as string | null) !== agentId) return false;
      const st = typeof r.status === "string" ? r.status : "";
      const ps = typeof r.pipeline_stage === "string" ? r.pipeline_stage : "";
      return st === "chaud" || hotPipeline.has(ps);
    }).length;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-600/90">
            Pilotage
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-4xl font-bold tracking-tight text-slate-900">
            <Users className="h-9 w-9 text-stone-600" />
            Performance par agent
          </h1>
          <p className="mt-2 text-slate-500">
            Contacts, biens et leads prioritaires (statut chaud ou étape pipeline
            visite / offre / signature) par agent.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-500 hover:text-stone-800"
        >
          ← Tableau de bord
        </Link>
      </div>

      <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3 font-semibold">Agent</th>
              <th className="px-5 py-3 font-semibold">Rôle</th>
              <th className="px-5 py-3 font-semibold tabular-nums">Contacts</th>
              <th className="px-5 py-3 font-semibold tabular-nums">Biens</th>
              <th className="px-5 py-3 font-semibold tabular-nums">
                Leads prioritaires
              </th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {memberList.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  Aucun membre trouvé. Vérifiez les politiques RLS sur{" "}
                  <code className="rounded bg-slate-100 px-1">profiles</code> si
                  la liste est vide.
                </td>
              </tr>
            ) : (
              memberList.map((m) => {
                const id = m.id as string;
                const nc = countFor(id, contactRows as { agent_id?: string | null }[]);
                const np = countFor(id, propertyRows as { agent_id?: string | null }[]);
                const pri = priorityLeadsFor(
                  id,
                  contactRows as {
                    agent_id?: string | null;
                    status?: string | null;
                    pipeline_stage?: string | null;
                  }[]
                );
                return (
                  <tr key={id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {(m.full_name as string)?.trim() || id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {typeof m.role === "string" ? m.role : "—"}
                    </td>
                    <td className="px-5 py-3 tabular-nums">{nc}</td>
                    <td className="px-5 py-3 tabular-nums">{np}</td>
                    <td className="px-5 py-3 tabular-nums text-amber-900/90">
                      {pri}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
