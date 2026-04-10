import { callClaudeText } from "@/lib/ai-lab/call-claude";
import { loadAgencyContextSnippet } from "@/lib/ai-lab/agency-context";
import { parseJsonFromAssistant } from "@/lib/ai-lab/parse-json-from-assistant";
import { requireAgencySession } from "@/lib/ai-lab/require-agency-session";
import { z } from "zod";

const bodySchema = z.object({
  text: z.string().min(20).max(48_000),
  docType: z
    .enum(["mandat", "offre", "compromis", "autre"])
    .optional()
    .default("autre"),
});

const outputShape = z.object({
  resume: z.string(),
  points_cles: z.array(z.string()),
  points_vigilance: z.array(z.string()),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Texte trop court ou requête invalide." },
      { status: 400 }
    );
  }

  const session = await requireAgencySession();
  if (!session.ok) return session.response;

  const ctx = await loadAgencyContextSnippet(session.supabase, session.agencyId);

  const typeLabel =
    parsed.data.docType === "autre"
      ? "document immobilier"
      : parsed.data.docType;

  const user = `Contexte agence : ${ctx}
Type de document (indication) : ${typeLabel}

Texte collé :
---
${parsed.data.text}
---

Produis un résumé opérationnel pour l’agent. Réponds UNIQUEMENT avec un JSON :
{
  "resume": "2-5 phrases",
  "points_cles": ["...", "..."],
  "points_vigilance": ["risques, dates, montants, clauses à vérifier"]
}`;

  let raw: string;
  try {
    raw = await callClaudeText({
      system:
        "Tu es un assistant pour agents immobiliers en France. Tu analyses du texte collé (pas de fichier). Tu ne remplaces pas un notaire ni un juriste : signale les points à faire valider. JSON uniquement.",
      user,
      maxTokens: 3072,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Échec de l’appel IA.";
    return Response.json({ error: message }, { status: 502 });
  }

  let data: unknown;
  try {
    data = parseJsonFromAssistant(raw);
  } catch {
    return Response.json(
      { error: "Réponse IA illisible." },
      { status: 502 }
    );
  }

  const check = outputShape.safeParse(data);
  if (!check.success) {
    return Response.json(
      { error: "Format inattendu renvoyé par l’IA." },
      { status: 502 }
    );
  }

  return Response.json({ analysis: check.data });
}
