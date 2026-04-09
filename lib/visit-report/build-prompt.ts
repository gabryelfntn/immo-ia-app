import { formatPriceEUR } from "@/lib/properties/labels";

export type PropertyForVisitPrompt = {
  title: string;
  type: string;
  transaction: "vente" | "location";
  price: number;
  surface: number;
  rooms: number;
  bedrooms: number;
  city: string;
  address: string;
  zip_code: string;
  description: string | null;
};

export type ContactForVisitPrompt = {
  first_name: string;
  last_name: string;
  type: string;
  budget_min: number | null;
  budget_max: number | null;
  desired_city: string | null;
};

function formatBudget(
  min: number | null,
  max: number | null,
  transaction: "vente" | "location"
): string {
  if (min == null && max == null) return "Non renseigné";
  const fmt = (n: number) => formatPriceEUR(n, transaction);
  if (min != null && max != null) return `${fmt(min)} — ${fmt(max)}`;
  if (min != null) return `À partir de ${fmt(min)}`;
  return `Jusqu’à ${fmt(max!)}`;
}

export function buildVisitReportUserPrompt(
  property: PropertyForVisitPrompt,
  contact: ContactForVisitPrompt,
  visitDate: string,
  visitNotes: string
): string {
  const clientName = `${contact.first_name} ${contact.last_name}`.trim();
  const priceLabel = formatPriceEUR(property.price, property.transaction);
  const budgetLabel = formatBudget(
    contact.budget_min,
    contact.budget_max,
    property.transaction
  );

  const desc =
    property.description?.trim() && property.description.length > 0
      ? property.description.slice(0, 4000)
      : "(aucune description en base)";

  return `## Date de la visite
${visitDate}

## Bien visité
- Titre : ${property.title}
- Type : ${property.type}
- Transaction : ${property.transaction}
- Prix affiché : ${priceLabel}
- Surface : ${property.surface} m²
- Pièces / chambres : ${property.rooms} / ${property.bedrooms}
- Adresse : ${property.address}, ${property.zip_code} ${property.city}
- Description (extrait) :
${desc}

## Client
- Nom : ${clientName}
- Profil CRM (type) : ${contact.type}
- Budget indicatif : ${budgetLabel}
- Ville recherchée : ${contact.desired_city ?? "Non renseigné"}

## Notes brutes de l'agent (pendant ou après la visite)
${visitNotes.trim()}

À partir de ces éléments, produis le JSON demandé dans le message système.`;
}
