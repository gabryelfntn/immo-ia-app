import type { SupabaseClient } from "@supabase/supabase-js";

export async function logAuditEvent(
  supabase: SupabaseClient,
  args: {
    agencyId: string;
    actorId: string;
    entityType: string;
    entityId: string;
    action: string;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await supabase.from("audit_log").insert({
    agency_id: args.agencyId,
    actor_id: args.actorId,
    entity_type: args.entityType,
    entity_id: args.entityId,
    action: args.action,
    payload: args.payload ?? null,
  });
  if (error) {
    console.warn("[audit_log]", error.message);
  }
}
