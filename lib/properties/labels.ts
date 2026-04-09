import type {
  PropertyStatus,
  PropertyTransaction,
  PropertyType,
} from "./schema";

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  appartement: "Appartement",
  maison: "Maison",
  terrain: "Terrain",
  commerce: "Commerce",
  bureau: "Bureau",
};

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  disponible: "Disponible",
  sous_compromis: "Sous compromis",
  vendu: "Vendu",
  loue: "Loué",
};

export const TRANSACTION_LABELS: Record<PropertyTransaction, string> = {
  vente: "Vente",
  location: "Location",
};

export function statusBadgeClass(status: PropertyStatus): string {
  switch (status) {
    case "disponible":
      return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80";
    case "sous_compromis":
      return "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80";
    case "vendu":
      return "bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200";
    case "loue":
      return "bg-sky-50 text-sky-900 ring-1 ring-sky-200/80";
    default:
      return "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200";
  }
}

export function formatPriceEUR(
  price: number,
  transaction: PropertyTransaction
): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
  return transaction === "location" ? `${formatted} / mois` : formatted;
}
