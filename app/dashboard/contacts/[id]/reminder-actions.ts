"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type ReminderMutationResult =
  | { ok: true }
  | { ok: false; error: string };

async function requireAgencyContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, ctx: null as null | { userId: string; agencyId: string } };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.agency_id) {
    return { supabase, ctx: null };
  }

  return {
    supabase,
    ctx: { userId: user.id, agencyId: profile.agency_id },
  };
}

const createSchema = z.object({
  contactId: z.string().uuid(),
  remind_at: z.string().min(1),
  note: z.string().max(1000).optional(),
});

export async function createContactSendReminder(
  input: unknown
): Promise<ReminderMutationResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Données invalides." };
  }

  const { supabase, ctx } = await requireAgencyContext();
  if (!ctx) {
    return { ok: false, error: "Session ou agence introuvable." };
  }

  const when = new Date(parsed.data.remind_at);
  if (Number.isNaN(when.getTime())) {
    return { ok: false, error: "Date de rappel invalide." };
  }

  const { data: contact } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", parsed.data.contactId)
    .eq("agency_id", ctx.agencyId)
    .maybeSingle();

  if (!contact) {
    return { ok: false, error: "Contact introuvable." };
  }

  const { error } = await supabase.from("contact_send_reminders").insert({
    agency_id: ctx.agencyId,
    agent_id: ctx.userId,
    contact_id: parsed.data.contactId,
    remind_at: when.toISOString(),
    note: parsed.data.note?.trim() || null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/dashboard/contacts/${parsed.data.contactId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/journee");
  return { ok: true };
}

export async function completeContactSendReminder(
  reminderId: string
): Promise<ReminderMutationResult> {
  const { supabase, ctx } = await requireAgencyContext();
  if (!ctx) {
    return { ok: false, error: "Session ou agence introuvable." };
  }

  const { data: row } = await supabase
    .from("contact_send_reminders")
    .select("contact_id")
    .eq("id", reminderId)
    .eq("agency_id", ctx.agencyId)
    .maybeSingle();

  if (!row) {
    return { ok: false, error: "Rappel introuvable." };
  }

  const { error } = await supabase
    .from("contact_send_reminders")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", reminderId)
    .eq("agency_id", ctx.agencyId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/dashboard/contacts/${row.contact_id as string}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/journee");
  return { ok: true };
}
