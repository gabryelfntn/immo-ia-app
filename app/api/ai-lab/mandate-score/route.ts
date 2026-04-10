import { callClaudeText } from "@/lib/ai-lab/call-claude";
import { loadAgencyContextSnippet } from "@/lib/ai-lab/agency-context";
import { loadPropertyForAgency } from "@/lib/ai-lab/load-property-for-agency";
import { parseJsonFromAssistant } from "@/lib/ai-lab/parse-json-from-assistant";
import { formatPropertyForPrompt } from "@/lib/ai-lab/property-row";
import { requireAgencySession } from "@/lib/ai-lab/require-agency-session";
import { z } from "zod";

const bodySchema = z.object({
  propertyId: z.string().uuid("Identifiant de bien invalide."),
});

const outputShape = z.object({
  score: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.string()),
  risks: z.array(z.string()),
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
    const msg =
      parsed.error.flatten().fieldErrors.propertyId?.[0] ?? "Requête invalide.";
    return Response.json({ error: msg }, { status: 400 });
  }

  const session = await requireAgencySession();
  if (!session.ok) return session.response;

  const { property, error } = await loadPropertyForAgency(
    session.supabase,
    parsed.data.propertyId,
    session.agencyId
  );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!property) {
    return Response.json({ error: "Bien introuvable." }, { status: 404 });
  }

  const ctx = await loadAgencyContextSnippet(session.supabase, session.agencyId);

  const user = `${ctx}

Évalue la « qualité commerciale » du mandat / fiche bien suivante (pouvoir de vente non vérifié ici). Donne un score indicatif 0–100 basé sur : attractivité annonce, cohérence prix/surface, description, différenciation.

Fiche :
${formatPropertyForPrompt(property)}

Réponds UNIQUEMENT avec un JSON :
{
  "score": 0-100,
  "summary": "2-4 phrases",
  "strengths": ["..."],
  "risks": ["..."]
}`;

  let raw: string;
  try {
    raw = await callClaudeText({
      system:
        "Tu es un coach commercial pour agents immobiliers en France. Score indicatif seulement, pas un jugement juridique. JSON uniquement.",
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
    return Response.json({ error: "Réponse IA illisible." }, { status: 502 });
  }

  const check = outputShape.safeParse(data);
  if (!check.success) {
    return Response.json(
      { error: "Format de score inattendu." },
      { status: 502 }
    );
  }

  return Response.json({ result: check.data });
}
