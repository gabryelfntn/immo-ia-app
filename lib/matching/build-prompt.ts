import { CONTACT_TYPE_LABELS } from "@/lib/contacts/labels";
import { PROPERTY_TYPE_LABELS } from "@/lib/properties/labels";
import type { ContactType } from "@/lib/contacts/schema";
import type { PropertyType } from "@/lib/properties/schema";

export type ContactForMatching = {
  first_name: string;
  last_name: string;
  type: string;
  status: string;
  budget_min: number | null;
  budget_max: number | null;
  desired_city: string | null;
  notes: string | null;
};

export type PropertyForMatching = {
  id: string;
  title: string;
  type: string;
  transaction: string;
  price: number;
  surface: number;
  rooms: number;
  bedrooms: number;
  city: string;
  zip_code: string;
  address: string;
  description: string | null;
  /** Non inclus dans le prompt IA, utilisé côté API pour la réponse */
  image_url?: string | null;
};

export function buildMatchingUserPrompt(
  contact: ContactForMatching,
  properties: PropertyForMatching[]
): string {
  const ctype = contact.type as ContactType;
  const typeLabel = CONTACT_TYPE_LABELS[ctype] ?? contact.type;

  const budgetParts: string[] = [];
  if (contact.budget_min != null) {
    budgetParts.push(`min ${contact.budget_min} €`);
  }
  if (contact.budget_max != null) {
    budgetParts.push(`max ${contact.budget_max} €`);
  }
  const budgetLine =
    budgetParts.length > 0 ? budgetParts.join(", ") : "non renseigné";

  const cityLine =
    contact.desired_city?.trim() || "non renseignée";

  const notesRaw = contact.notes?.trim() ?? "";
  const notesLine =
    notesRaw.length > 450 ? `${notesRaw.slice(0, 450)}…` : notesRaw || "aucune";

  const contactBlock = [
    `Nom : ${contact.first_name} ${contact.last_name}`,
    `Type de contact (CRM) : ${typeLabel} — utile pour déduire vente vs location ou intention d'achat.`,
    `Statut pipeline : ${contact.status}`,
    `Budget : ${budgetLine}`,
    `Ville recherchée : ${cityLine}`,
    `Note : il n'y a pas de champ "type de bien recherché" en base ; déduis-le des notes et du profil si possible.`,
    `Notes internes : ${notesLine}`,
  ].join("\n");

  const propsLines = properties.map((p, i) => {
    const ptype = p.type as PropertyType;
    const typeFr = PROPERTY_TYPE_LABELS[ptype] ?? p.type;
    const desc = p.description?.trim()
      ? p.description.trim().slice(0, 200).replace(/\s+/g, " ")
      : "";
    return [
      `--- Bien ${i + 1} ---`,
      `propertyId: ${p.id}`,
      `Titre: ${p.title}`,
      `Type: ${typeFr}`,
      `Transaction: ${p.transaction}`,
      `Prix: ${p.price} €`,
      `Surface: ${p.surface} m²`,
      `Pièces: ${p.rooms}, chambres: ${p.bedrooms}`,
      `Ville: ${p.city} (${p.zip_code})`,
      `Adresse: ${p.address}`,
      desc ? `Description (extrait): ${desc}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  });

  return [
    "Analyse la compatibilité entre ce contact et les biens listés ci-dessous.",
    "Ne retourne que des propertyId présents dans la liste.",
    "",
    "=== PROFIL CONTACT ===",
    contactBlock,
    "",
    `=== BIENS DISPONIBLES (${properties.length}) ===`,
    propsLines.join("\n\n"),
  ].join("\n");
}
