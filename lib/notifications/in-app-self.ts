import type { SupabaseClient } from "@supabase/supabase-js";

export async function insertSelfNotification(
  supabase: SupabaseClient,
  args: {
    agencyId: string;
    userId: string;
    title: string;
    body?: string | null;
    link?: string | null;
    kind?: string;
  }
): Promise<void> {
  const { error } = await supabase.from("in_app_notifications").insert({
    agency_id: args.agencyId,
    user_id: args.userId,
    title: args.title,
    body: args.body?.trim() || null,
    link: args.link?.trim() || null,
    kind: args.kind ?? "info",
  });
  if (error) {
    console.warn("[in_app_notifications]", error.message);
  }
}
