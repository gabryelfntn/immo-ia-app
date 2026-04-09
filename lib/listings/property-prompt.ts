import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
  TRANSACTION_LABELS,
  formatPriceEUR,
} from "@/lib/properties/labels";
import type { PropertyStatus, PropertyType } from "@/lib/properties/schema";

export type PropertyRowForListing = {
  title: string;
  type: string;
  transaction: string;
  price: number | string;
  surface: number | string;
  rooms: number | string;
  bedrooms: number | string;
  address: string;
  city: string;
  zip_code: string;
  description: string | null;
  status: string;
};

export function buildPropertyListingUserPrompt(row: PropertyRowForListing): string {
  const ptype = row.type as PropertyType;
  const status = row.status as PropertyStatus;
  const transaction = row.transaction as "vente" | "location";

  const lines = [
    "Rédige trois variantes d'annonce immobilière en français à partir des informations suivantes.",
    "",
    `Titre interne / référence : ${row.title}`,
    `Type de bien : ${PROPERTY_TYPE_LABELS[ptype] ?? row.type}`,
    `Transaction : ${TRANSACTION_LABELS[transaction] ?? row.transaction}`,
    `Prix : ${formatPriceEUR(Number(row.price), transaction)}`,
    `Surface : ${row.surface} m²`,
    `Pièces : ${row.rooms} — Chambres : ${row.bedrooms}`,
    `Adresse : ${row.address}, ${row.zip_code} ${row.city}`,
    `Statut du bien : ${PROPERTY_STATUS_LABELS[status] ?? row.status}`,
    "",
    "Description existante (à exploiter ou améliorer, ne pas inventer de données factuelles contradictoires) :",
    row.description?.trim() ? row.description.trim() : "(aucune description fournie)",
  ];

  return lines.join("\n");
}
