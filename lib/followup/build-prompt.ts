import { formatPriceEUR } from "@/lib/properties/labels";

export type FollowupContact = {
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  type: string;
  budget_min: number | null;
  budget_max: number | null;
  desired_city: string | null;
  last_contacted_at: string | null;
  created_at: string;
};

export type FollowupProperty = {
  id: string;
  title: string;
  transaction: "vente" | "location";
  type: string;
  price: number;
  surface: number;
  city: string;
};

function computeInactivityDays(lastActivityISO: string): number {
  const last = new Date(lastActivityISO).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - last);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatBudget(min: number | null, max: number | null): string {
  if (min == null && max == null) return "Non renseigné";
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(n);
  if (min != null && max != null) return `${fmt(min)} — ${fmt(max)}`;
  if (min != null) return `À partir de ${fmt(min)}`;
  return `Jusqu’à ${fmt(max!)}`;
}

export function buildFollowupUserPrompt(args: {
  contact: FollowupContact;
  properties: FollowupProperty[];
}): string {
  const { contact, properties } = args;
  const name = `${contact.first_name} ${contact.last_name}`.trim();
  const lastActivityISO = contact.last_contacted_at ?? contact.created_at;
  const days = computeInactivityDays(lastActivityISO);

  const propsLines =
    properties.length === 0
      ? "Aucun bien n'a été pré-sélectionné."
      : properties
          .map((p, i) => {
            const priceLabel = formatPriceEUR(p.price, p.transaction);
            return [
              `--- Bien ${i + 1} ---`,
              `id: ${p.id}`,
              `Titre: ${p.title}`,
              `Type: ${p.type}`,
              `Transaction: ${p.transaction}`,
              `Prix: ${priceLabel}`,
              `Surface: ${p.surface} m²`,
              `Ville: ${p.city}`,
              `Lien interne: /dashboard/biens/${p.id}`,
            ].join("\n");
          })
          .join("\n\n");

  return [
    "Rédige un email de relance pour un contact CRM devenu inactif.",
    "L'objectif: reprendre contact de façon naturelle et proposer de l'aide ou 1-3 biens pertinents si disponibles.",
    "Ne pas être insistant. Pas de phrases génériques type 'j'espère que vous allez bien' si possible.",
    "",
    "=== CONTACT ===",
    `Nom: ${name}`,
    `Email: ${contact.email}`,
    `Type CRM: ${contact.type}`,
    `Statut pipeline: ${contact.status}`,
    `Budget: ${formatBudget(contact.budget_min, contact.budget_max)}`,
    `Ville recherchée: ${contact.desired_city ?? "Non renseignée"}`,
    `Dernière activité (ISO): ${lastActivityISO}`,
    `Jours sans contact: ${days}`,
    "",
    "=== BIENS SUGGÉRÉS (si pertinents) ===",
    propsLines,
    "",
    "Consignes de style:",
    "- ton professionnel, chaleureux, bref (120 à 200 mots environ)",
    "- inclure une question de qualification (ex: budget, secteur, timing, critères).",
    "- si des biens sont fournis: en citer 1 à 3 avec 1 phrase chacun.",
    "",
    "Réponds en JSON avec { subject, body, tone } uniquement.",
  ].join("\n");
}

