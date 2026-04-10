import type { SupabaseClient } from "@supabase/supabase-js";
import { computeLeadScore } from "./lead-score";
import type { ContactStatus } from "@/lib/contacts/schema";
import type { PipelineStage } from "@/lib/contacts/schema";
import {
  parsePipelineStage,
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGES_ORDERED,
} from "@/lib/contacts/pipeline";
import {
  currentMonthRangeISO,
  isInLocalMonth,
  lastNMonthBuckets,
  previousMonthRangeISO,
} from "./time";
import { normalizeRole, isAgentOnly } from "@/lib/auth/agency-scope";
import {
  buildDashboardSuggestions,
  type DashboardSuggestion,
  type SuggestionContactRow,
  type SuggestionPropertyRow,
} from "@/lib/dashboard/suggestions";

export type DashboardPayload = {
  userFirstName: string | null;
  agencyName: string;
  metrics: {
    biensActifs: number;
    vendusLouesCeMois: number;
    prospectsChauds: number;
    totalContacts: number;
    annoncesIA: number;
    tauxConversion: number;
    clientsCount: number;
    momPct: {
      biensActifs: number | null;
      vendusLoues: number | null;
      prospectsChauds: number | null;
      totalContacts: number | null;
      annoncesIA: number | null;
      tauxConversion: number | null;
    };
  };
  chartBiensParMois: { label: string; biens: number }[];
  chartContactsStatut: { name: string; value: number; fill: string }[];
  chartFlux: { label: string; disponibles: number; vendusLoues: number }[];
  recentProperties: {
    id: string;
    title: string;
    city: string;
    status: string;
    created_at: string;
  }[];
  recentContacts: {
    id: string;
    name: string;
    status: string;
    created_at: string;
  }[];
  /** Suivi relances (colonnes CRM + table followup_emails). */
  relances: {
    inactive14Plus: number;
    followupsSentThisMonth: number;
    followupsFailedThisMonth: number;
    optedOutCount: number;
  };
  /** Pipeline commercial (étapes mandat / vente). */
  pipelineFunnel: { stage: PipelineStage; label: string; count: number }[];
  /** Tâches ouvertes (table agency_tasks). */
  tasksSummary: {
    openCount: number;
    overdue: number;
    dueToday: number;
  };
  /** Contacts à prioriser (score interne). */
  topLeads: {
    id: string;
    name: string;
    score: number;
    pipeline_stage: PipelineStage;
    status: ContactStatus;
  }[];
  /** Actions recommandées (règles métier locales). */
  suggestions: DashboardSuggestion[];
};

const STATUS_COLORS: Record<string, string> = {
  Froid: "#78716c",
  Tiède: "#b45309",
  Chaud: "#9a3412",
  Client: "#1c1917",
};

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return null;
    return 100;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function isInRange(iso: string, startISO: string, endISO: string): boolean {
  const t = new Date(iso).getTime();
  return t >= new Date(startISO).getTime() && t <= new Date(endISO).getTime();
}

function daysSince(iso: string): number {
  const last = new Date(iso).getTime();
  return Math.floor(Math.max(0, Date.now() - last) / (1000 * 60 * 60 * 24));
}

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

export async function fetchDashboardData(
  supabase: SupabaseClient,
  agencyId: string,
  userId: string
): Promise<DashboardPayload | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", userId)
    .maybeSingle();

  const role = normalizeRole(
    typeof profile?.role === "string" ? profile.role : null
  );

  const { data: agency } = await supabase
    .from("agencies")
    .select("name")
    .eq("id", agencyId)
    .maybeSingle();

  const userFirstName =
    typeof profile?.full_name === "string" && profile.full_name.trim()
      ? profile.full_name.trim().split(/\s+/)[0] ?? null
      : null;

  const agencyName = agency?.name ?? "Votre agence";

  const [
    { data: properties, error: propErr },
    { data: contacts, error: contErr },
    { data: listings, error: listErr },
    tasksRes,
  ] = await Promise.all([
    supabase
      .from("properties")
      .select(
        "id, title, city, status, created_at, updated_at, agent_id"
      )
      .eq("agency_id", agencyId),
    supabase
      .from("contacts")
      .select(
        "id, first_name, last_name, type, status, pipeline_stage, budget_min, budget_max, desired_city, created_at, last_contacted_at, followup_opt_out, agent_id"
      )
      .eq("agency_id", agencyId),
    supabase
      .from("generated_listings")
      .select("property_id, created_at")
      .eq("agency_id", agencyId),
    supabase
      .from("agency_tasks")
      .select("id, due_at, completed_at, agent_id")
      .eq("agency_id", agencyId)
      .limit(2000),
  ]);

  if (propErr || contErr) {
    return null;
  }

  const propsRaw = properties ?? [];
  const contsRaw = contacts ?? [];
  const props = isAgentOnly(role)
    ? propsRaw.filter((p) => (p as { agent_id?: string }).agent_id === userId)
    : propsRaw;
  const conts = isAgentOnly(role)
    ? contsRaw.filter((c) => (c as { agent_id?: string }).agent_id === userId)
    : contsRaw;

  const agentPropIds = new Set(props.map((p) => p.id as string));
  const gensRaw = listErr ? [] : (listings ?? []);
  const gens = isAgentOnly(role)
    ? gensRaw.filter((g) => {
        const pid = (g as { property_id?: string }).property_id;
        return typeof pid === "string" && agentPropIds.has(pid);
      })
    : gensRaw;

  const tasksAll =
    tasksRes.error || !tasksRes.data ? [] : tasksRes.data;
  const tasksRows = isAgentOnly(role)
    ? tasksAll.filter((t) => (t as { agent_id?: string }).agent_id === userId)
    : tasksAll;

  const now = new Date();
  const cy = now.getFullYear();
  const cm = now.getMonth();

  const cur = currentMonthRangeISO();
  const prev = previousMonthRangeISO();

  const biensActifs = props.filter((p) => p.status === "disponible").length;

  const vendusLouesCeMois = props.filter(
    (p) =>
      (p.status === "vendu" || p.status === "loue") &&
      p.updated_at &&
      isInRange(p.updated_at as string, cur.start, cur.end)
  ).length;

  const vendusLouesMoisPrec = props.filter(
    (p) =>
      (p.status === "vendu" || p.status === "loue") &&
      p.updated_at &&
      isInRange(p.updated_at as string, prev.start, prev.end)
  ).length;

  const prospectsChauds = conts.filter((c) => c.status === "chaud").length;

  const chaudCreesCeMois = conts.filter(
    (c) =>
      c.status === "chaud" &&
      isInRange(c.created_at as string, cur.start, cur.end)
  ).length;

  const chaudCreesMoisPrec = conts.filter(
    (c) =>
      c.status === "chaud" &&
      isInRange(c.created_at as string, prev.start, prev.end)
  ).length;

  const totalContacts = conts.length;
  const clients = conts.filter((c) => c.status === "client").length;
  const tauxConversion =
    totalContacts === 0
      ? 0
      : Math.round((clients / totalContacts) * 1000) / 10;

  const clientsCount = clients;

  const contactsCreesCeMois = conts.filter((c) =>
    isInRange(c.created_at as string, cur.start, cur.end)
  ).length;

  const contactsCreesMoisPrec = conts.filter((c) =>
    isInRange(c.created_at as string, prev.start, prev.end)
  ).length;

  const annoncesIA = gens.length;

  const annoncesCeMois = gens.filter((g) =>
    isInRange(g.created_at as string, cur.start, cur.end)
  ).length;

  const annoncesMoisPrec = gens.filter((g) =>
    isInRange(g.created_at as string, prev.start, prev.end)
  ).length;

  const nouveauxBiensCeMois = props.filter((p) =>
    isInLocalMonth(p.created_at as string, cy, cm)
  ).length;

  const prevMonth = cm === 0 ? 11 : cm - 1;
  const prevYear = cm === 0 ? cy - 1 : cy;
  const nouveauxBiensMoisPrec = props.filter((p) =>
    isInLocalMonth(p.created_at as string, prevYear, prevMonth)
  ).length;

  const buckets = lastNMonthBuckets(6);

  const chartBiensParMois = buckets.map((b) => ({
    label: b.label,
    biens: props.filter((p) =>
      isInLocalMonth(p.created_at as string, b.year, b.month)
    ).length,
  }));

  const statusLabels: Record<string, string> = {
    froid: "Froid",
    tiede: "Tiède",
    chaud: "Chaud",
    client: "Client",
  };

  const chartContactsStatut = (["froid", "tiede", "chaud", "client"] as const).map(
    (s) => {
      const value = conts.filter((c) => c.status === s).length;
      return {
        name: statusLabels[s],
        value,
        fill: STATUS_COLORS[statusLabels[s]] ?? "#44403c",
      };
    }
  );

  const chartFlux = buckets.map((b) => ({
    label: b.label,
    disponibles: props.filter(
      (p) =>
        p.status === "disponible" &&
        isInLocalMonth(p.created_at as string, b.year, b.month)
    ).length,
    vendusLoues: props.filter(
      (p) =>
        (p.status === "vendu" || p.status === "loue") &&
        p.updated_at &&
        isInLocalMonth(p.updated_at as string, b.year, b.month)
    ).length,
  }));

  const recentProperties = [...props]
    .sort(
      (a, b) =>
        new Date(b.created_at as string).getTime() -
        new Date(a.created_at as string).getTime()
    )
    .slice(0, 5)
    .map((p) => ({
      id: p.id as string,
      title: p.title as string,
      city: p.city as string,
      status: p.status as string,
      created_at: p.created_at as string,
    }));

  const recentContacts = [...conts]
    .sort(
      (a, b) =>
        new Date(b.created_at as string).getTime() -
        new Date(a.created_at as string).getTime()
    )
    .slice(0, 5)
    .map((c) => ({
      id: c.id as string,
      name: `${c.first_name as string} ${c.last_name as string}`,
      status: c.status as string,
      created_at: c.created_at as string,
    }));

  const optedOutCount = conts.filter((c) =>
    Boolean((c as { followup_opt_out?: boolean }).followup_opt_out)
  ).length;

  const inactive14Plus = conts.filter((c) => {
    if (Boolean((c as { followup_opt_out?: boolean }).followup_opt_out)) {
      return false;
    }
    const lc = (c as { last_contacted_at?: string | null }).last_contacted_at;
    const lastActivity =
      typeof lc === "string" && lc.trim() ? lc : (c.created_at as string);
    return daysSince(lastActivity) >= 14;
  }).length;

  let followupsSentThisMonth = 0;
  let followupsFailedThisMonth = 0;
  const fuRes = await supabase
    .from("followup_emails")
    .select("created_at, status, agent_id")
    .eq("agency_id", agencyId)
    .limit(4000);

  if (!fuRes.error && fuRes.data) {
    for (const row of fuRes.data) {
      if (
        isAgentOnly(role) &&
        (row as { agent_id?: string }).agent_id !== userId
      ) {
        continue;
      }
      const iso = row.created_at as string;
      if (!isInRange(iso, cur.start, cur.end)) continue;
      if (row.status === "sent") followupsSentThisMonth += 1;
      else if (row.status === "failed") followupsFailedThisMonth += 1;
    }
  }

  const openTasks = tasksRows.filter((t) => !t.completed_at);
  const sod = startOfLocalDay();
  const eod = endOfLocalDay();

  let overdue = 0;
  let dueToday = 0;
  for (const t of openTasks) {
    const ts = new Date(t.due_at as string).getTime();
    if (ts < sod) overdue += 1;
    else if (ts >= sod && ts <= eod) dueToday += 1;
  }

  const pipelineFunnel = PIPELINE_STAGES_ORDERED.map((stage) => ({
    stage,
    label: PIPELINE_STAGE_LABELS[stage],
    count: conts.filter(
      (c) =>
        parsePipelineStage(
          (c as { pipeline_stage?: string | null }).pipeline_stage
        ) === stage
    ).length,
  }));

  const scored = conts.map((c) => {
    const pipeline_stage = parsePipelineStage(
      (c as { pipeline_stage?: string | null }).pipeline_stage
    );
    const status = c.status as ContactStatus;
    const score = computeLeadScore({
      status,
      pipeline_stage,
      budget_min: c.budget_min != null ? Number(c.budget_min) : null,
      budget_max: c.budget_max != null ? Number(c.budget_max) : null,
      desired_city: (c as { desired_city?: string | null }).desired_city ?? null,
      last_contacted_at:
        (c as { last_contacted_at?: string | null }).last_contacted_at ?? null,
      created_at: c.created_at as string,
    });
    return {
      id: c.id as string,
      name: `${c.first_name as string} ${c.last_name as string}`,
      score,
      pipeline_stage,
      status,
    };
  });
  scored.sort((a, b) => b.score - a.score);
  const topLeads = scored.slice(0, 5);

  const suggestions = buildDashboardSuggestions(
    conts as unknown as SuggestionContactRow[],
    props as unknown as SuggestionPropertyRow[]
  );

  return {
    userFirstName,
    agencyName,
    metrics: {
      biensActifs,
      vendusLouesCeMois,
      prospectsChauds,
      totalContacts,
      annoncesIA,
      tauxConversion,
      clientsCount,
      momPct: {
        biensActifs: pctChange(nouveauxBiensCeMois, nouveauxBiensMoisPrec),
        vendusLoues: pctChange(vendusLouesCeMois, vendusLouesMoisPrec),
        prospectsChauds: pctChange(chaudCreesCeMois, chaudCreesMoisPrec),
        totalContacts: pctChange(contactsCreesCeMois, contactsCreesMoisPrec),
        annoncesIA: pctChange(annoncesCeMois, annoncesMoisPrec),
        tauxConversion: null,
      },
    },
    chartBiensParMois,
    chartContactsStatut,
    chartFlux,
    recentProperties,
    recentContacts,
    relances: {
      inactive14Plus,
      followupsSentThisMonth,
      followupsFailedThisMonth,
      optedOutCount,
    },
    pipelineFunnel,
    tasksSummary: {
      openCount: openTasks.length,
      overdue,
      dueToday,
    },
    topLeads,
    suggestions,
  };
}
