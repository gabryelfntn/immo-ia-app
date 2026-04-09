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
      return "bg-white/[0.06] text-zinc-300 ring-1 ring-white/10";
    case "tiede":
      return "bg-amber-500/12 text-amber-200/95 ring-1 ring-amber-400/25";
    case "chaud":
      return "bg-rose-500/12 text-rose-200/95 ring-1 ring-rose-400/28";
    case "client":
      return "bg-emerald-500/12 text-emerald-200/95 ring-1 ring-emerald-400/28";
    default:
      return "bg-white/[0.06] text-zinc-300 ring-1 ring-white/10";
  }
}
