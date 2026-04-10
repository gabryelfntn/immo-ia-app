import { createClient } from "@/lib/supabase/server";
import { callClaudeText } from "@/lib/ai-lab/call-claude";
import {
  PIPELINE_STAGE_LABELS,
  parsePipelineStage,
} from "@/lib/contacts/pipeline";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    contactId?: string;
  };
  const contactId = body.contactId?.trim();
  if (!contactId) {
    return Response.json({ error: "contactId requis." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return Response.json({ error: "Agence introuvable." }, { status: 403 });
  }

  const { data: row, error } = await supabase
    .from("contacts")
    .select(
      "first_name, last_name, email, phone, type, status, notes, pipeline_stage, budget_min, budget_max, desired_city, last_contacted_at, last_followup_sent_at, created_at"
    )
    .eq("id", contactId)
    .eq("agency_id", profile.agency_id)
    .maybeSingle();

  if (error || !row) {
    return Response.json({ error: "Contact introuvable." }, { status: 404 });
  }

  const { data: visits } = await supabase
    .from("visit_reports")
    .select("visit_date, summary")
    .eq("contact_id", contactId)
    .eq("agency_id", profile.agency_id)
    .order("visit_date", { ascending: false })
    .limit(5);

  const { data: tasks } = await supabase
    .from("agency_tasks")
    .select("title, due_at, completed_at")
    .eq("contact_id", contactId)
    .eq("agency_id", profile.agency_id)
    .is("completed_at", null)
    .order("due_at", { ascending: true })
    .limit(8);

  const stage = parsePipelineStage(
    row.pipeline_stage as string | null | undefined
  );
  const stageLabel = PIPELINE_STAGE_LABELS[stage] ?? String(stage);

  const visitLines = (visits ?? [])
    .map(
      (v) =>
        `- ${String(v.visit_date)} : ${String(v.summary ?? "").slice(0, 400)}`
    )
    .join("\n");

  const taskLines = (tasks ?? [])
    .map((t) => `- ${t.title} (échéance ${String(t.due_at)})`)
    .join("\n");

  const userBlock = `
Contact : ${row.first_name} ${row.last_name}
Email / tél. : ${row.email} / ${row.phone}
Type / statut CRM : ${row.type} / ${row.status}
Étape pipeline : ${stageLabel}
Budget : ${row.budget_min ?? "—"} – ${row.budget_max ?? "—"} € · Ville : ${row.desired_city ?? "—"}
Dernière relance email : ${row.last_followup_sent_at ?? "—"}
Dernier contact enregistré : ${row.last_contacted_at ?? "—"}
Notes internes (extrait) :
${String(row.notes ?? "").slice(0, 2500)}

Dernières visites (extraits) :
${visitLines || "—"}

Tâches ouvertes liées :
${taskLines || "—"}
`.trim();

  try {
    const text = await callClaudeText({
      system: `Tu es un assistant commercial pour une agence immobilière en France. 
Réponds en français, ton professionnel et concis.
Structure ta réponse en 3 blocs markdown courts :
## Synthèse
## Prochaines actions suggérées (3 à 5 puces)
## Formulations (1 phrase pour relance email ou SMS, sans promesse juridique)
Ne donne pas de conseil juridique ; rappelle que l'agent doit valider.`,
      user: userBlock,
      maxTokens: 2048,
    });
    return Response.json({ ok: true, markdown: text });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur IA.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
