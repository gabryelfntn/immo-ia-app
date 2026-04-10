import { callClaudeText } from "@/lib/ai-lab/call-claude";
import { loadAgencyContextSnippet } from "@/lib/ai-lab/agency-context";
import { requireAgencySession } from "@/lib/ai-lab/require-agency-session";
import { z } from "zod";

const bodySchema = z.object({
  question: z.string().max(2000).optional(),
  focus: z
    .enum(["general", "relances", "mandats", "annonces", "visites"])
    .optional()
    .default("general"),
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
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const session = await requireAgencySession();
  if (!session.ok) return session.response;

  const ctx = await loadAgencyContextSnippet(session.supabase, session.agencyId);

  const focusLine =
    parsed.data.focus === "general"
      ? "Donne une checklist courte pour bien démarrer avec ce CRM."
      : `Concentre-toi sur le thème : ${parsed.data.focus} (dans le contexte d’un CRM immobilier).`;

  const q = parsed.data.question?.trim();
  const user = `${ctx}

${focusLine}
${q ? `\nQuestion de l’agent :\n${q}\n` : ""}

Réponds en français : 2–3 paragraphes max + 3 puces actionnables immédiates. Pas de markdown lourd.`;

  let tip: string;
  try {
    tip = await callClaudeText({
      system:
        "Tu es un formateur pour nouveaux agents immobiliers en France. Concret, bienveillant, sans jargon inutile.",
      user,
      maxTokens: 1200,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Échec de l’appel IA.";
    return Response.json({ error: message }, { status: 502 });
  }

  return Response.json({ tip });
}
