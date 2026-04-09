const VISIT_REPORT_SYSTEM_PROMPT = `Tu es un expert immobilier français. Tu rédiges des comptes-rendus de visite professionnels, structurés et personnalisés. Réponds uniquement en JSON :
{ summary: string, positivePoints: string[], negativePoints: string[], clientInterest: 'fort' | 'moyen' | 'faible', recommendation: string, nextStep: string }

Ne mets aucun texte en dehors du JSON. Les clés doivent être exactement : summary, positivePoints, negativePoints, clientInterest, recommendation, nextStep.`;

const ANTHROPIC_VERSION = "2023-06-01";

export async function callClaudeForVisitReport(
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("ANTHROPIC_API_KEY manquant.");
  }

  const model =
    process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: VISIT_REPORT_SYSTEM_PROMPT,
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
