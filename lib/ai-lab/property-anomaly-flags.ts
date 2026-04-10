import type { PropertyRowForAiLab } from "./property-row";

export function computePropertyAnomalyFlags(
  p: PropertyRowForAiLab
): string[] {
  const flags: string[] = [];
  if (p.price <= 0) flags.push("Prix nul ou négatif.");
  if (p.surface <= 0) flags.push("Surface nulle ou négative.");
  if (p.bedrooms > p.rooms) {
    flags.push("Plus de chambres que de pièces (incohérence).");
  }
  if (p.rooms < 1) flags.push("Nombre de pièces suspect.");

  const m2 = p.surface > 0 ? p.price / p.surface : 0;
  if (m2 > 25_000) {
    flags.push("Prix au m² très élevé — vérifiez la saisie.");
  }
  if (p.transaction === "vente" && m2 > 0 && m2 < 400) {
    flags.push("Prix au m² très bas pour une vente — vérifiez le prix ou la surface.");
  }

  const desc = p.description?.trim() ?? "";
  if (desc.length < 40) {
    flags.push("Description courte ou absente (impact annonce et mandat).");
  }

  if (p.surface > 5000 || p.rooms > 30) {
    flags.push("Surface ou nombre de pièces inhabituellement élevés.");
  }

  return flags;
}
