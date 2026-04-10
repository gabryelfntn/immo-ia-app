export type AgencyRole = "admin" | "manager" | "agent";

/**
 * Interprète le champ `profiles.role`.
 * - trim + casse ignorée (ex. "Admin" → admin)
 * - null / vide → admin (comptes existants sans valeur explicite, aligné migration)
 */
export function normalizeRole(raw: string | null | undefined): AgencyRole {
  if (raw == null) return "admin";
  const s = String(raw).trim().toLowerCase();
  if (s === "") return "admin";
  if (s === "admin" || s === "manager" || s === "agent") return s;
  return "agent";
}

export function roleDisplayLabel(role: AgencyRole): string {
  if (role === "admin") return "Administrateur";
  if (role === "manager") return "Manager";
  return "Agent";
}

export function isAgentOnly(role: AgencyRole): boolean {
  return role === "agent";
}

export function canViewTeamPerformance(role: AgencyRole): boolean {
  return role === "admin" || role === "manager";
}
