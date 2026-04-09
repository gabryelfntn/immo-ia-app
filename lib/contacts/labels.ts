import type { ContactStatus, ContactType } from "./schema";

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  prospect: "Prospect",
  acheteur: "Acheteur",
  vendeur: "Vendeur",
  locataire: "Locataire",
  proprietaire: "Propriétaire",
};

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  froid: "Froid",
  tiede: "Tiède",
  chaud: "Chaud",
  client: "Client",
};

export function contactStatusBadgeClass(status: ContactStatus): string {
  switch (status) {
    case "froid":
      return "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200";
    case "tiede":
      return "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80";
    case "chaud":
      return "bg-rose-50 text-rose-800 ring-1 ring-rose-200/80";
    case "client":
      return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80";
    default:
      return "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200";
  }
}
