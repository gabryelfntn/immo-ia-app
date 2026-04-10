import { createClient } from "@/lib/supabase/server";
import { callClaudeText } from "@/lib/ai-lab/call-claude";
import { isAgentOnly, normalizeRole } from "@/lib/auth/agency-scope";

type MetricResult =
  | { label: string; value: string; detail?: string }
  | { label: string; rows: { k: string; v: string }[] };

/**
 * Questions en langage naturel → métriques sûres (agrégations côté serveur uniquement).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return Response.json({ error: "Agence introuvable." }, { status: 403 });
  }

  const agencyId = profile.agency_id;
  const role = normalizeRole(profile.role as string | null);
  const agentOnly = isAgentOnly(role);
  const agentId = agentOnly ? user.id : null;

  const body = (await request.json().catch(() => ({}))) as { q?: string };
  const q = body.q?.trim() ?? "";
  if (q.length < 3) {
    return Response.json(
      { error: "Posez une question (au moins 3 caractères)." },
      { status: 400 }
    );
  }

  const catalog = `
Métriques disponibles (id) :
- contacts_total : nombre de contacts
- contacts_pipeline : répartition par étape pipeline
- properties_status : répartition des biens par statut
- tasks_open : tâches non terminées à 14 jours
- visits_30d : nombre de comptes rendus de visite sur 30 jours
`;

  let metricId = "contacts_total";
  try {
    const pick = await callClaudeText({
      system: `Tu choisis UNE métrique pour répondre à la question de l'utilisateur.
Réponds uniquement par un mot : l'id exact parmi la liste fournie, rien d'autre.`,
      user: `${catalog}\n\nQuestion : ${q.slice(0, 500)}`,
      maxTokens: 40,
    });
    const id = pick.trim().split(/\s+/)[0] ?? "contacts_total";
    if (
      [
        "contacts_total",
        "contacts_pipeline",
        "properties_status",
        "tasks_open",
        "visits_30d",
      ].includes(id)
    ) {
      metricId = id;
    }
  } catch {
    metricId = "contacts_total";
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + 14 * 24 * 3600 * 1000).toISOString();

  let result: MetricResult;

  if (metricId === "contacts_total") {
    let qc = supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", agencyId);
    if (agentId) qc = qc.eq("agent_id", agentId);
    const { count } = await qc;
    result = {
      label: "Contacts",
      value: String(count ?? 0),
      detail: agentOnly ? "Vos contacts uniquement." : "Toute l’agence.",
    };
  } else if (metricId === "contacts_pipeline") {
    let qc = supabase
      .from("contacts")
      .select("pipeline_stage")
      .eq("agency_id", agencyId);
    if (agentId) qc = qc.eq("agent_id", agentId);
    const { data: rows } = await qc;
    const map = new Map<string, number>();
    for (const r of rows ?? []) {
      const k = String((r as { pipeline_stage?: string }).pipeline_stage ?? "—");
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    result = {
      label: "Contacts par étape pipeline",
      rows: [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => ({ k, v: String(v) })),
    };
  } else if (metricId === "properties_status") {
    let qp = supabase
      .from("properties")
      .select("status")
      .eq("agency_id", agencyId);
    if (agentId) qp = qp.eq("agent_id", agentId);
    const { data: rows } = await qp;
    const map = new Map<string, number>();
    for (const r of rows ?? []) {
      const k = String((r as { status?: string }).status ?? "—");
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    result = {
      label: "Biens par statut",
      rows: [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => ({ k, v: String(v) })),
    };
  } else if (metricId === "tasks_open") {
    let qt = supabase
      .from("agency_tasks")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .is("completed_at", null)
      .lte("due_at", horizon);
    if (agentId) qt = qt.eq("agent_id", agentId);
    const { count } = await qt;
    result = {
      label: "Tâches ouvertes dues sous 14 jours",
      value: String(count ?? 0),
    };
  } else {
    const sinceStr = new Date(now.getTime() - 30 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
    let qv = supabase
      .from("visit_reports")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .gte("visit_date", sinceStr);
    if (agentId) {
      qv = qv.eq("agent_id", user.id);
    }
    const { count } = await qv;
    result = {
      label: "Visites enregistrées (30 derniers jours)",
      value: String(count ?? 0),
      detail: "Comptage des lignes visit_reports.",
    };
  }

  let answer = "";
  try {
    answer = await callClaudeText({
      system:
        "Tu es un analyste CRM. En 2 phrases maximum en français, interprète le résultat chiffré pour l'utilisateur. Pas de markdown titre.",
      user: `Question : ${q}\nMétrique utilisée : ${metricId}\nRésultat brut : ${JSON.stringify(result)}`,
      maxTokens: 256,
    });
  } catch {
    answer = "";
  }

  return Response.json({ ok: true, metricId, result, interpretation: answer });
}
