export type AgencyRole = "admin" | "manager" | "agent";

export function normalizeRole(raw: string | null | undefined): AgencyRole {
  if (raw === "admin" || raw === "manager" || raw === "agent") return raw;
  return "agent";
}

export function isAgentOnly(role: AgencyRole): boolean {
  return role === "agent";
}

export function canViewTeamPerformance(role: AgencyRole): boolean {
  return role === "admin" || role === "manager";
}
