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
      return "bg-zinc-500/15 text-zinc-200 ring-1 ring-zinc-400/25";
    case "tiede":
      return "bg-orange-500/15 text-orange-200 ring-1 ring-orange-400/30";
    case "chaud":
      return "bg-red-500/15 text-red-200 ring-1 ring-red-400/30";
    case "client":
      return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/25";
    default:
      return "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-400/20";
  }
}
