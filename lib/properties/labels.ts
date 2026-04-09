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
      return "bg-emerald-500/12 text-emerald-200/95 ring-1 ring-emerald-400/28";
    case "sous_compromis":
      return "bg-amber-500/12 text-amber-200/95 ring-1 ring-amber-400/25";
    case "vendu":
      return "bg-white/[0.06] text-slate-600 ring-1 ring-white/10";
    case "loue":
      return "bg-sky-500/12 text-sky-200/95 ring-1 ring-sky-400/28";
    default:
      return "bg-white/[0.06] text-slate-600 ring-1 ring-white/10";
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
