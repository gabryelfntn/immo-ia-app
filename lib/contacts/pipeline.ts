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
      return "bg-slate-100 text-slate-800 ring-1 ring-slate-200/90";
    case "qualifie":
      return "bg-sky-50 text-sky-900/90 ring-1 ring-sky-200/80";
    case "visite":
      return "bg-stone-100 text-stone-800 ring-1 ring-stone-300/90";
    case "offre":
      return "bg-amber-50 text-amber-900/90 ring-1 ring-amber-200/80";
    case "signature":
      return "bg-emerald-50 text-emerald-900/90 ring-1 ring-emerald-200/80";
    case "fidelisation":
      return "bg-neutral-100 text-neutral-800 ring-1 ring-neutral-300/90";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200/90";
  }
}
