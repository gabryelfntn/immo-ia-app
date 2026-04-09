const MATCHING_SYSTEM_PROMPT = `Tu es un expert en immobilier et en matching entre prospects et biens en France.
Tu analyses la compatibilité entre le profil de recherche d'un contact et une liste de biens disponibles.
Réponds UNIQUEMENT en JSON valide avec ce format exact :
{ "matches": [ { "propertyId": "<uuid du bien>", "score": <nombre entre 0 et 100>, "reason": "<1 à 2 phrases courtes en français, factuelles et professionnelles>" } ] }

Règles strictes :
- Au maximum 5 entrées dans "matches", triées par score décroissant (du plus compatible au moins).
- Chaque "propertyId" doit être EXACTEMENT l'un des identifiants UUID fournis dans la liste des biens (copie-colle, sans invention).
- "score" : nombre de 0 à 100 (compatibilité globale : budget, localisation, type de bien, transaction vente/location, surface/pièces si pertinent).
- Si aucun bien n'est raisonnablement compatible, retourne { "matches": [] }.
- Ne mets pas de texte en dehors du JSON.`;

const ANTHROPIC_VERSION = "2023-06-01";

export async function callClaudeForMatching(userPrompt: string): Promise<string> {
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
      max_tokens: 8192,
      system: MATCHING_SYSTEM_PROMPT,
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
