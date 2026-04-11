import { createClient } from "@/lib/supabase/server";
import { buildTextPdf } from "@/lib/pdf/simple-pdf";
import { PIPELINE_STAGE_LABELS } from "@/lib/contacts/pipeline";
import { parsePipelineStage } from "@/lib/contacts/pipeline";

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Non authentifié.", { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return new Response("Agence introuvable.", { status: 403 });
  }

  const { data: row, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("agency_id", profile.agency_id)
    .maybeSingle();

  if (error || !row) {
    return new Response("Contact introuvable.", { status: 404 });
  }

  const stage = parsePipelineStage(row.pipeline_stage as string | null);
  const stageLabel = PIPELINE_STAGE_LABELS[stage] ?? String(stage);

  const lines = [
    `Nom : ${row.first_name} ${row.last_name}`,
    `Email : ${row.email}`,
    `Téléphone : ${row.phone}`,
    `Type / statut : ${row.type} / ${row.status}`,
    `Étape pipeline : ${stageLabel}`,
    `Budget : ${row.budget_min ?? "—"} — ${row.budget_max ?? "—"} €`,
    `Ville recherchée : ${row.desired_city ?? "—"}`,
    `Source : ${row.source ?? "—"}`,
    "",
    "Notes :",
    String(row.notes ?? "").slice(0, 8000),
  ];

  const pdf = await buildTextPdf(
    lines,
    `Fiche contact — ${row.first_name} ${row.last_name}`
  );
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="contact-${id.slice(0, 8)}.pdf"`,
    },
  });
}
