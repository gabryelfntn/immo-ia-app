import { PIPELINE_STAGES } from "./schema";
import type { PipelineStage } from "./schema";

export function parsePipelineStage(raw: unknown): PipelineStage {
  const s = typeof raw === "string" ? raw : "";
  return (PIPELINE_STAGES as readonly string[]).includes(s)
    ? (s as PipelineStage)
    : "premier_contact";
}

export const PIPELINE_STAGES_ORDERED: PipelineStage[] = [
  "premier_contact",
  "qualifie",
  "visite",
  "offre",
  "signature",
  "fidelisation",
];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  premier_contact: "Premier contact",
  qualifie: "Qualifié",
  visite: "Visite",
  offre: "Offre",
  signature: "Signature",
  fidelisation: "Fidélisation",
};

export function pipelineStageBadgeClass(stage: PipelineStage): string {
  switch (stage) {
    case "premier_contact":
      return "bg-zinc-500/15 text-zinc-200 ring-1 ring-zinc-500/25";
    case "qualifie":
      return "bg-sky-500/15 text-sky-200/95 ring-1 ring-sky-400/25";
    case "visite":
      return "bg-violet-500/15 text-violet-200/95 ring-1 ring-violet-400/25";
    case "offre":
      return "bg-amber-500/15 text-amber-200/95 ring-1 ring-amber-400/25";
    case "signature":
      return "bg-emerald-500/15 text-emerald-200/95 ring-1 ring-emerald-400/28";
    case "fidelisation":
      return "bg-fuchsia-500/15 text-fuchsia-200/95 ring-1 ring-fuchsia-400/25";
    default:
      return "bg-white/[0.06] text-zinc-300 ring-1 ring-white/10";
  }
}
