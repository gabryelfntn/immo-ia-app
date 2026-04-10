import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole, isAgentOnly } from "@/lib/auth/agency-scope";
import { computeLeadScore } from "@/lib/dashboard/lead-score";
import { parsePipelineStage } from "@/lib/contacts/pipeline";
import { PIPELINE_STAGE_LABELS } from "@/lib/contacts/pipeline";
import type { ContactStatus, PipelineStage } from "@/lib/contacts/schema";
import { CONTACT_STATUS_LABELS } from "@/lib/contacts/labels";
import { Calendar, ListTodo, Phone, Target, Bell } from "lucide-react";

function startOfLocalDay(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfLocalDay(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function daysInactive(lastActivityISO: string): number {
  const last = new Date(lastActivityISO).getTime();
  return Math.floor(Math.max(0, Date.now() - last) / (1000 * 60 * 60 * 24));
}

export default async function JourneePage() {
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
        <h1 className="text-3xl font-bold text-slate-900">Ma journée</h1>
        <p className="mt-2 text-sm text-slate-500">Aucune agence associée.</p>
      </div>
    );
  }

  const agencyId = profile.agency_id as string;
  const role = normalizeRole(profile.role as string | null);
  const agentOnly = isAgentOnly(role);

  let taskQ = supabase
    .from("agency_tasks")
    .select("id, title, due_at, completed_at, contact_id")
    .eq("agency_id", agencyId)
    .is("completed_at", null)
    .order("due_at", { ascending: true });

  if (agentOnly) {
    taskQ = taskQ.eq("agent_id", user.id);
  }

  const { data: taskRows } = await taskQ;

  const sod = startOfLocalDay();
  const eod = endOfLocalDay();
  const now = Date.now();
  const tasks = taskRows ?? [];
  const overdue = tasks.filter((t) => new Date(t.due_at as string).getTime() < sod);
  const dueToday = tasks.filter((t) => {
    const ts = new Date(t.due_at as string).getTime();
    return ts >= sod && ts <= eod;
  });
  const soon = tasks.filter((t) => {
    const ts = new Date(t.due_at as string).getTime();
    return ts > eod && ts < now + 3 * 86400_000;
  });

  let contactQ = supabase
    .from("contacts")
    .select(
      "id, first_name, last_name, email, status, type, pipeline_stage, budget_min, budget_max, desired_city, last_contacted_at, created_at, followup_opt_out, agent_id"
    )
    .eq("agency_id", agencyId)
    .eq("followup_opt_out", false);

  if (agentOnly) {
    contactQ = contactQ.eq("agent_id", user.id);
  }

  const { data: allContacts } = await contactQ;

  const relanceCandidates = (allContacts ?? [])
    .map((c) => {
      const last =
        (typeof c.last_contacted_at === "string" && c.last_contacted_at) ||
        (c.created_at as string);
      return {
        id: c.id as string,
        name: `${c.first_name} ${c.last_name}`,
        days: daysInactive(last),
      };
    })
    .filter((c) => c.days >= 7)
    .sort((a, b) => b.days - a.days)
    .slice(0, 8);

  let visitQ = supabase
    .from("visit_reports")
    .select(
      `
      id,
      visit_date,
      summary,
      properties ( title, city ),
      contacts ( first_name, last_name )
    `
    )
    .eq("agency_id", agencyId)
    .order("visit_date", { ascending: false })
    .limit(6);

  if (agentOnly) {
    visitQ = visitQ.eq("agent_id", user.id);
  }

  const { data: recentVisits } = await visitQ;

  const scored = (allContacts ?? []).map((c) => {
    const pipeline_stage = parsePipelineStage(
      (c as { pipeline_stage?: string | null }).pipeline_stage
    ) as PipelineStage;
    const status = c.status as ContactStatus;
    const score = computeLeadScore({
      status,
      pipeline_stage,
      budget_min: c.budget_min != null ? Number(c.budget_min) : null,
      budget_max: c.budget_max != null ? Number(c.budget_max) : null,
      desired_city:
        typeof c.desired_city === "string" ? c.desired_city : null,
      last_contacted_at:
        (c as { last_contacted_at?: string | null }).last_contacted_at ??
        null,
      created_at: c.created_at as string,
    });
    return {
      id: c.id as string,
      name: `${c.first_name} ${c.last_name}`,
      score,
      pipeline_stage,
      status,
    };
  });
  scored.sort((a, b) => b.score - a.score);
  const topLeads = scored.slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-600/90">
            Organisation
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
            Ma journée
          </h1>
          <p className="mt-2 text-slate-500">
            Tâches, relances et priorités en un coup d&apos;œil.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-500 hover:text-stone-800"
        >
          ← Tableau de bord
        </Link>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="card-luxury rounded-2xl border border-slate-200/90 bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <ListTodo className="h-5 w-5 text-stone-600" />
            Tâches
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            En retard, aujourd&apos;hui et prochains jours.
          </p>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="font-semibold text-rose-800">En retard ({overdue.length})</p>
              <ul className="mt-2 space-y-2">
                {overdue.length === 0 ? (
                  <li className="text-slate-500">Aucune</li>
                ) : (
                  overdue.slice(0, 6).map((t) => (
                    <li key={t.id as string}>
                      <span className="font-medium text-slate-800">
                        {t.title as string}
                      </span>
                      <span className="text-slate-500">
                        {" "}
                        ·{" "}
                        {new Intl.DateTimeFormat("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(t.due_at as string))}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-amber-800">
                Aujourd&apos;hui ({dueToday.length})
              </p>
              <ul className="mt-2 space-y-2">
                {dueToday.length === 0 ? (
                  <li className="text-slate-500">Aucune</li>
                ) : (
                  dueToday.map((t) => (
                    <li key={t.id as string}>
                      <span className="font-medium text-slate-800">
                        {t.title as string}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Bientôt ({soon.length})</p>
              <ul className="mt-2 space-y-2">
                {soon.length === 0 ? (
                  <li className="text-slate-500">Aucune dans les 3 jours</li>
                ) : (
                  soon.slice(0, 5).map((t) => (
                    <li key={t.id as string} className="text-slate-600">
                      {t.title as string}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
          <Link
            href="/dashboard/taches"
            className="mt-4 inline-block text-sm font-semibold text-stone-700 hover:text-stone-900"
          >
            Ouvrir toutes les tâches →
          </Link>
        </section>

        <section className="card-luxury rounded-2xl border border-slate-200/90 bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Bell className="h-5 w-5 text-stone-600" />
            Relances à prévoir
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Contacts sans activité depuis au moins 7 jours (hors opt-out).
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {relanceCandidates.length === 0 ? (
              <li className="text-slate-500">Rien d&apos;urgent ici.</li>
            ) : (
              relanceCandidates.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/contacts/${c.id}`}
                    className="font-medium text-stone-800 hover:underline"
                  >
                    {c.name}
                  </Link>
                  <span className="text-slate-500"> · {c.days} j.</span>
                </li>
              ))
            )}
          </ul>
          <Link
            href="/dashboard/relances"
            className="mt-4 inline-block text-sm font-semibold text-stone-700 hover:text-stone-900"
          >
            Aller aux relances →
          </Link>
        </section>
      </div>

      <section className="mt-6 card-luxury rounded-2xl border border-slate-200/90 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Calendar className="h-5 w-5 text-stone-600" />
          Comptes-rendus de visite récents
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Derniers rapports enregistrés (pas de module de visite planifiée séparé).
        </p>
        <ul className="mt-4 space-y-3 text-sm">
          {(recentVisits ?? []).length === 0 ? (
            <li className="text-slate-500">Aucun rapport récent.</li>
          ) : (
            (recentVisits ?? []).map((v) => {
              const p = v.properties as { title?: string; city?: string } | null;
              const ct = v.contacts as
                | { first_name?: string; last_name?: string }
                | null;
              const place = [p?.title, p?.city].filter(Boolean).join(" · ");
              const who = ct
                ? `${ct.first_name ?? ""} ${ct.last_name ?? ""}`.trim()
                : "";
              return (
                <li key={v.id as string} className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                  <span className="font-medium text-slate-800">{place || "Visite"}</span>
                  {who ? (
                    <span className="text-slate-500"> · {who}</span>
                  ) : null}
                  <span className="block text-xs text-slate-400">
                    {v.visit_date as string}
                  </span>
                </li>
              );
            })
          )}
        </ul>
        <Link
          href="/dashboard/visites"
          className="mt-4 inline-block text-sm font-semibold text-stone-700 hover:text-stone-900"
        >
          Toutes les visites →
        </Link>
      </section>

      <section className="mt-6 card-luxury rounded-2xl border border-slate-200/90 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Target className="h-5 w-5 text-stone-600" />
          Top 5 leads à contacter
        </h2>
        <ul className="mt-4 space-y-2 text-sm">
          {topLeads.length === 0 ? (
            <li className="text-slate-500">Aucun contact.</li>
          ) : (
            topLeads.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/dashboard/contacts/${l.id}`}
                  className="font-medium text-stone-800 hover:underline"
                >
                  {l.name}
                </Link>
                <span className="text-xs text-slate-500">
                  Score {l.score} · {PIPELINE_STAGE_LABELS[l.pipeline_stage]} ·{" "}
                  {CONTACT_STATUS_LABELS[l.status]}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-stone-300 bg-stone-50/80 px-4 py-3 text-sm text-stone-600">
        <Phone className="h-5 w-5 shrink-0 text-stone-500" aria-hidden />
        <span>
          Pensez à enregistrer un contact après chaque échange depuis la fiche
          contact.
        </span>
      </section>
    </div>
  );
}
