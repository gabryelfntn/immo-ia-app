import type { AgencyRole } from "@/lib/auth/agency-scope";

/** Suppression contact : admin/manager agence, ou agent sur ses propres contacts. */
export function canDeleteContact(
  role: AgencyRole,
  userId: string,
  contactAgentId: string
): boolean {
  if (role === "admin" || role === "manager") return true;
  return userId === contactAgentId;
}

/** Export CSV « tout l’agence » : déjà filtré côté requête pour les agents ; managers voient tout. */
export function canViewAllContactsInAgency(role: AgencyRole): boolean {
  return role === "admin" || role === "manager";
}
