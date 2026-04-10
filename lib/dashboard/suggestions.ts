import { computeLeadScore } from "@/lib/dashboard/lead-score";
import { parsePipelineStage } from "@/lib/contacts/pipeline";
import type { ContactStatus, PipelineStage } from "@/lib/contacts/schema";

export type DashboardSuggestion = {
  id: string;
  title: string;
  description: string;
  href: string;
  priority: number;
};

function daysSince(iso: string): number {
  const last = new Date(iso).getTime();
  return Math.floor(Math.max(0, Date.now() - last) / (1000 * 60 * 60 * 24));
}

export type SuggestionContactRow = {
  id: string;
  first_name: string;
  last_name: string;
  type: string;
  status: string;
  pipeline_stage?: string | null;
  last_contacted_at?: string | null;
  created_at: string;
  budget_min?: number | null;
  budget_max?: number | null;
  desired_city?: string | null;
  followup_opt_out?: boolean;
};

export type SuggestionPropertyRow = {
  id: string;
  status: string;
  city: string;
};

export function buildDashboardSuggestions(
  contacts: SuggestionContactRow[],
  properties: SuggestionPropertyRow[]
): DashboardSuggestion[] {
  const out: DashboardSuggestion[] = [];
  const disponibles = properties.filter((p) => p.status === "disponible");

  for (const c of contacts) {
    const optOut = Boolean(c.followup_opt_out);
    const name = `${c.first_name} ${c.last_name}`.trim();
    const pipeline = parsePipelineStage(
      c.pipeline_stage
    ) as PipelineStage;
    const status = c.status as ContactStatus;
    const score = computeLeadScore({
      status,
      pipeline_stage: pipeline,
      budget_min: c.budget_min != null ? Number(c.budget_min) : null,
      budget_max: c.budget_max != null ? Number(c.budget_max) : null,
      desired_city:
        typeof c.desired_city === "string" ? c.desired_city : null,
      last_contacted_at: c.last_contacted_at ?? null,
      created_at: c.created_at,
    });

    const last =
      typeof c.last_contacted_at === "string" && c.last_contacted_at.trim()
        ? c.last_contacted_at
        : c.created_at;
    const inactiveDays = daysSince(last);

    if (!optOut && inactiveDays >= 10 && status !== "client") {
      out.push({
        id: `inactive-${c.id}`,
        title: `Relancer ${name}`,
        description: `Aucun contact enregistré depuis ${inactiveDays} jours.`,
        href: `/dashboard/contacts/${c.id}`,
        priority: 80 + Math.min(15, inactiveDays - 10),
      });
    }

    if (status === "chaud" && (pipeline === "premier_contact" || pipeline === "qualifie")) {
      out.push({
        id: `hot-${c.id}`,
        title: `Prospect chaud : ${name}`,
        description: "Accélérer la prise en charge (étape encore tôt du pipeline).",
        href: `/dashboard/contacts/${c.id}`,
        priority: 92,
      });
    }

    if (score >= 75 && status !== "client") {
      out.push({
        id: `score-${c.id}`,
        title: `Priorité : ${name}`,
        description: `Score interne élevé (${score}) — proche de convertir.`,
        href: `/dashboard/contacts/${c.id}`,
        priority: 88,
      });
    }
  }

  if (disponibles.length > 0 && contacts.length > 0) {
    const activeBuyers = contacts.filter(
      (c) =>
        (c.type === "acheteur" || c.type === "prospect") &&
        c.status !== "client"
    );
    if (activeBuyers.length >= 3 && disponibles.length >= 1) {
      out.push({
        id: "matching-global",
        title: "Opportunités de matching",
        description: `${disponibles.length} bien(s) disponible(s) pour ${activeBuyers.length} contact(s) actifs — lancez des analyses depuis les fiches.`,
        href: "/dashboard/contacts",
        priority: 55,
      });
    }
  }

  out.sort((a, b) => b.priority - a.priority);
  const seen = new Set<string>();
  const dedup: DashboardSuggestion[] = [];
  for (const s of out) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    dedup.push(s);
    if (dedup.length >= 8) break;
  }
  return dedup;
}
