import { callClaudeText } from "@/lib/ai-lab/call-claude";
import { loadAgencyContextSnippet } from "@/lib/ai-lab/agency-context";
import { loadPropertyForAgency } from "@/lib/ai-lab/load-property-for-agency";
import { computePropertyAnomalyFlags } from "@/lib/ai-lab/property-anomaly-flags";
import { formatPropertyForPrompt } from "@/lib/ai-lab/property-row";
import { requireAgencySession } from "@/lib/ai-lab/require-agency-session";
import { z } from "zod";

const bodySchema = z.object({
  propertyId: z.string().uuid("Identifiant de bien invalide."),
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

  const flags = computePropertyAnomalyFlags(property);
  const ctx = await loadAgencyContextSnippet(session.supabase, session.agencyId);

  const user = `${ctx}

Contrôles automatiques déjà détectés (peuvent être faux positifs) :
${flags.length ? flags.map((f) => `- ${f}`).join("\n") : "- Aucun drapeau automatique."}

Fiche bien :
${formatPropertyForPrompt(property)}

En 1 court paragraphe + une liste à puces max 5 items, explique les anomalies ou incohérences possibles (prix, surface, texte, crédibilité annonce). Si tout semble cohérent, dis-le clairement. Français, ton pro.`;

  let comment: string;
  try {
    comment = await callClaudeText({
      system:
        "Tu aides des agents immobiliers à relire des fiches biens. Tu restes prudent : signale les doutes sans affirmer de fraude.",
      user,
      maxTokens: 1024,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Échec de l’appel IA.";
    return Response.json({ error: message }, { status: 502 });
  }

  return Response.json({ flags, comment });
}
