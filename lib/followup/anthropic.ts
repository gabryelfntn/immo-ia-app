const FOLLOWUP_SYSTEM_PROMPT = `Tu es un agent immobilier français professionnel et chaleureux. Tu rédiges des emails de relance personnalisés, naturels et non génériques. Réponds en JSON : { subject: string, body: string, tone: string }

Contraintes :
- Le sujet doit être court et concret.
- Le corps doit être en français, naturel, sans jargon, avec des retours à la ligne.
- Personnalise avec le prénom/nom et le contexte (profil, biens suggérés).
- Ne mets aucun texte en dehors du JSON.`;

const ANTHROPIC_VERSION = "2023-06-01";

export async function callClaudeForFollowup(userPrompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("ANTHROPIC_API_KEY manquant.");
  }

  const model =
    process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-5";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: FOLLOWUP_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    let detail = raw;
    try {
      const j = JSON.parse(raw) as { error?: { message?: string } };
      if (j?.error?.message) detail = j.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(`Anthropic: ${res.status} — ${detail}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Réponse Anthropic invalide (JSON).");
  }

  const content = (data as { content?: { type: string; text?: string }[] })
    .content;
  const block = content?.find((c) => c.type === "text");
  const text = block?.text?.trim();
  if (!text) {
    throw new Error("Réponse Anthropic sans texte.");
  }
  return text;
}

