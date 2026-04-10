export const MANDATE_CHECKLIST_KEYS = [
  "dpe",
  "diagnostics",
  "mandat_signe",
  "photos_ok",
  "honoraires_affichés",
] as const;

export type MandateChecklistKey = (typeof MANDATE_CHECKLIST_KEYS)[number];

export const MANDATE_CHECKLIST_LABELS: Record<MandateChecklistKey, string> = {
  dpe: "DPE à jour / mentionné",
  diagnostics: "Diagnostics obligatoires",
  mandat_signe: "Mandat signé",
  photos_ok: "Photos annonce prêtes",
  honoraires_affichés: "Honoraires affichés (annonce)",
};

export type MandateChecklistState = Partial<Record<MandateChecklistKey, boolean>>;

export function parseMandateChecklist(raw: unknown): MandateChecklistState {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const out: MandateChecklistState = {};
  for (const k of MANDATE_CHECKLIST_KEYS) {
    if (o[k] === true) out[k] = true;
  }
  return out;
}
