import { callClaudeText } from "@/lib/ai-lab/call-claude";
import { loadAgencyContextSnippet } from "@/lib/ai-lab/agency-context";
import { requireAgencySession } from "@/lib/ai-lab/require-agency-session";
import { z } from "zod";

const bodySchema = z.object({
  topic: z.string().min(10).max(8000),
  channel: z.enum(["linkedin", "instagram", "newsletter"]),
  tone: z
    .enum(["pro", "chaleureux", "direct"])
    .optional()
    .default("pro"),
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
    return Response.json({ error: "Sujet ou canal invalide." }, { status: 400 });
  }

  const session = await requireAgencySession();
  if (!session.ok) return session.response;

  const ctx = await loadAgencyContextSnippet(session.supabase, session.agencyId);

  const channelHints: Record<string, string> = {
    linkedin:
      "Format LinkedIn : accroche, corps avec sauts de ligne, 1–2 hashtags pertinents max, CTA discret.",
    instagram:
      "Format Instagram : ton plus court, émojis avec parcimonie, idée de légende + suggestion de phrase pour story.",
    newsletter:
      "Format newsletter : objet + préheader suggérés, titres, 2–3 paragraphes, lien d’action.",
  };

  const user = `${ctx}

Canal : ${parsed.data.channel}
Ton : ${parsed.data.tone}
Consignes : ${channelHints[parsed.data.channel]}

Sujet / consigne rédactionnelle :
${parsed.data.topic}

Rédige le contenu prêt à copier-coller (pas de JSON).`;

  let content: string;
  try {
    content = await callClaudeText({
      system:
        "Tu es chargé de communication pour une agence immobilière en France. Respecte la vérité : n’invente pas de mandats, prix ou biens. Texte en français.",
      user,
      maxTokens: 3072,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Échec de l’appel IA.";
    return Response.json({ error: message }, { status: 502 });
  }

  return Response.json({ content });
}
