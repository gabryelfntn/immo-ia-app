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
      return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/25";
    case "sous_compromis":
      return "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30";
    case "vendu":
      return "bg-zinc-500/15 text-zinc-200 ring-1 ring-zinc-400/20";
    case "loue":
      return "bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/25";
    default:
      return "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-400/20";
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
