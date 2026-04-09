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
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200/90";
    case "tiede":
      return "bg-amber-50 text-amber-900/90 ring-1 ring-amber-200/80";
    case "chaud":
      return "bg-rose-50 text-rose-900/90 ring-1 ring-rose-200/80";
    case "client":
      return "bg-emerald-50 text-emerald-900/90 ring-1 ring-emerald-200/80";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200/90";
  }
}
