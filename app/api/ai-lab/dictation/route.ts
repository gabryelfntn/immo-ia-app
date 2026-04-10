import { callClaudeText } from "@/lib/ai-lab/call-claude";
import { loadAgencyContextSnippet } from "@/lib/ai-lab/agency-context";
import { parseJsonFromAssistant } from "@/lib/ai-lab/parse-json-from-assistant";
import { requireAgencySession } from "@/lib/ai-lab/require-agency-session";
import { z } from "zod";

const bodySchema = z.object({
  transcript: z.string().min(3).max(16_000),
});

const outputShape = z.object({
  title: z.string(),
  structured_note: z.string(),
  next_actions: z.array(z.string()),
  tags: z.array(z.string()).optional().default([]),
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
    return Response.json({ error: "Transcription invalide ou trop courte." }, { status: 400 });
  }

  const session = await requireAgencySession();
  if (!session.ok) return session.response;

  const ctx = await loadAgencyContextSnippet(session.supabase, session.agencyId);

  const user = `Contexte : ${ctx}

Transcription dictée (brute) :
---
${parsed.data.transcript}
---

Transforme en note de CRM structurée. Réponds UNIQUEMENT avec un JSON valide :
{
  "title": "titre court",
  "structured_note": "texte clair avec paragraphes ou puces",
  "next_actions": ["action 1", "action 2"],
  "tags": ["optionnel", "mots-clés"]
}`;

  let raw: string;
  try {
    raw = await callClaudeText({
      system:
        "Tu es un assistant immobilier. Tu structures des notes à partir de dictées. Réponds uniquement en JSON, sans texte avant ou après.",
      user,
      maxTokens: 2048,
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
      { error: "Réponse IA illisible. Réessayez ou raccourcissez la dictée." },
      { status: 502 }
    );
  }

  const check = outputShape.safeParse(data);
  if (!check.success) {
    return Response.json(
      { error: "Format de note inattendu renvoyé par l’IA." },
      { status: 502 }
    );
  }

  return Response.json({ note: check.data });
}
