import type { ContactStatus, PipelineStage } from "@/lib/contacts/schema";

export type LeadScoreInput = {
  status: ContactStatus;
  pipeline_stage: PipelineStage;
  budget_min: number | null;
  budget_max: number | null;
  desired_city: string | null | undefined;
  last_contacted_at: string | null | undefined;
  created_at: string;
};

/**
 * Score 0–100 : priorisation commerciale (chaleur + étape pipeline + données + récence).
 */
export function computeLeadScore(c: LeadScoreInput): number {
  const statusScores: Record<ContactStatus, number> = {
    froid: 8,
    tiede: 22,
    chaud: 42,
    client: 28,
  };
  let score = statusScores[c.status] ?? 0;

  const pipe: Record<PipelineStage, number> = {
    premier_contact: 6,
    qualifie: 14,
    visite: 22,
    offre: 30,
    signature: 36,
    fidelisation: 18,
  };
  score += pipe[c.pipeline_stage] ?? 0;

  if (c.budget_min != null || c.budget_max != null) score += 10;
  if (typeof c.desired_city === "string" && c.desired_city.trim().length > 0) {
    score += 5;
  }

  const lastIso =
    typeof c.last_contacted_at === "string" && c.last_contacted_at.trim()
      ? c.last_contacted_at
      : c.created_at;
  const last = new Date(lastIso).getTime();
  const days = Math.max(0, (Date.now() - last) / 86_400_000);
  if (days <= 7) score += 14;
  else if (days <= 14) score += 9;
  else if (days <= 30) score += 4;

  return Math.min(100, Math.round(score));
}
