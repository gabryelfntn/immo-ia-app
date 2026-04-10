import { createClient } from "@/lib/supabase/server";
import { callClaudeText } from "@/lib/ai-lab/call-claude";

/**
 * À partir d'un texte collé (OCR, PDF copié, etc.), propose des champs CRM à mettre à jour.
 * L'agent valide toujours avant enregistrement.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    rawText?: string;
    contactId?: string;
  };

  const raw = body.rawText?.trim();
  if (!raw || raw.length < 20) {
    return Response.json(
      { error: "Collez au moins quelques lignes de texte (20 caractères min.)." },
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

  let contactHint = "";
  if (body.contactId) {
    const { data: c } = await supabase
      .from("contacts")
      .select("first_name, last_name, desired_city, budget_min, budget_max")
      .eq("id", body.contactId)
      .eq("agency_id", profile.agency_id)
      .maybeSingle();
    if (c) {
      contactHint = `Contexte contact existant : ${c.first_name} ${c.last_name}, budget ${c.budget_min ?? "—"}–${c.budget_max ?? "—"}, ville ${c.desired_city ?? "—"}.`;
    }
  }

  try {
    const text = await callClaudeText({
      system: `Tu aides à structurer des infos extraites d'un document immobilier (mandat, compromis, annonce copiée).
Réponds UNIQUEMENT en JSON valide, sans markdown, de la forme :
{"summary":"une phrase","suggested_updates":{"budget_min":null,"budget_max":null,"desired_city":null,"notes_addendum":null,"pipeline_stage_hint":null}}
Les montants sont en nombre entier ou null. pipeline_stage_hint : un parmi premier_contact, qualifie, visite, offre, clos si tu peux deviner, sinon null.
Ne crée pas de données sensibles inventées : si incertain, null.`,
      user: `${contactHint}\n\nTexte source :\n${raw.slice(0, 12000)}`,
      maxTokens: 1024,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return Response.json(
        { error: "L'IA n'a pas renvoyé du JSON exploitable. Réessayez." },
        { status: 502 }
      );
    }

    return Response.json({ ok: true, data: parsed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur IA.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
