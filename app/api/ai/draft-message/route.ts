import { createClient } from "@/lib/supabase/server";
import { callClaudeText } from "@/lib/ai-lab/call-claude";

const SCENARIOS = {
  post_visit: `Rédige un court message de suivi après une visite de bien (email ou SMS).
Ton chaleureux, professionnel, sans promesse contractuelle. 120 mots max.`,
  relance: `Rédige une relance douce pour un prospect immobilier qui n'a pas répondu depuis quelques jours.
Pas agressif, une question ouverte. 100 mots max.`,
  refus: `Rédige un message empathique pour annoncer qu'une offre ou un dossier n'est pas retenu.
Reste cordial, propose de rester en contact si pertinent. 110 mots max.`,
  sms_flash: `Rédige un SMS très court (max 300 caractères) pour prendre un créneau de rappel téléphonique.`,
} as const;

type Scenario = keyof typeof SCENARIOS;

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
    scenario?: string;
  };

  const contactId = body.contactId?.trim();
  const scenario = (body.scenario ?? "relance") as Scenario;
  if (!contactId || !(scenario in SCENARIOS)) {
    return Response.json(
      { error: "contactId et scenario valides requis." },
      { status: 400 }
    );
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
      "first_name, last_name, email, type, status, desired_city, pipeline_stage, notes"
    )
    .eq("id", contactId)
    .eq("agency_id", profile.agency_id)
    .maybeSingle();

  if (error || !row) {
    return Response.json({ error: "Contact introuvable." }, { status: 404 });
  }

  const brief = `
Prénom / nom : ${row.first_name} ${row.last_name}
Type / statut : ${row.type} / ${row.status}
Ville recherchée : ${row.desired_city ?? "non précisée"}
Étape pipeline : ${row.pipeline_stage ?? "—"}
Notes (extrait) : ${String(row.notes ?? "").slice(0, 1200)}
`.trim();

  try {
    const text = await callClaudeText({
      system: SCENARIOS[scenario],
      user: brief,
      maxTokens: 1024,
    });
    return Response.json({ ok: true, text });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur IA.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
