"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1, "Titre requis.").max(500),
  due_at: z.string().min(1, "Date requise."),
  notes: z.string().max(2000).optional(),
  contact_id: z.string().uuid().optional(),
  property_id: z.string().uuid().optional(),
});

export type TaskMutationResult =
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

export async function createAgencyTask(input: unknown): Promise<TaskMutationResult> {
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.title?.[0]
      ?? parsed.error.flatten().fieldErrors.due_at?.[0]
      ?? "Données invalides.";
    return { ok: false, error: msg };
  }

  const { supabase, ctx } = await requireAgencyContext();
  if (!ctx) {
    return { ok: false, error: "Session ou agence introuvable." };
  }

  const due = new Date(parsed.data.due_at);
  if (Number.isNaN(due.getTime())) {
    return { ok: false, error: "Date d’échéance invalide." };
  }

  const { error } = await supabase.from("agency_tasks").insert({
    agency_id: ctx.agencyId,
    agent_id: ctx.userId,
    title: parsed.data.title.trim(),
    due_at: due.toISOString(),
    notes: parsed.data.notes?.trim() || null,
    contact_id: parsed.data.contact_id ?? null,
    property_id: parsed.data.property_id ?? null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/taches");
  revalidatePath("/dashboard");
  if (parsed.data.contact_id) {
    revalidatePath(`/dashboard/contacts/${parsed.data.contact_id}`);
  }
  return { ok: true };
}

export async function completeAgencyTask(taskId: string): Promise<TaskMutationResult> {
  const { supabase, ctx } = await requireAgencyContext();
  if (!ctx) {
    return { ok: false, error: "Session ou agence introuvable." };
  }

  const { data: row, error: fetchErr } = await supabase
    .from("agency_tasks")
    .select("id, contact_id")
    .eq("id", taskId)
    .eq("agency_id", ctx.agencyId)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: "Tâche introuvable." };
  }

  const { error } = await supabase
    .from("agency_tasks")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("agency_id", ctx.agencyId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/taches");
  revalidatePath("/dashboard");
  if (row.contact_id) {
    revalidatePath(`/dashboard/contacts/${row.contact_id}`);
  }
  return { ok: true };
}

export async function snoozeAgencyTask(
  taskId: string,
  preset: "1d" | "7d"
): Promise<TaskMutationResult> {
  const { supabase, ctx } = await requireAgencyContext();
  if (!ctx) {
    return { ok: false, error: "Session ou agence introuvable." };
  }

  const { data: row, error: fetchErr } = await supabase
    .from("agency_tasks")
    .select("id, due_at, contact_id, property_id")
    .eq("id", taskId)
    .eq("agency_id", ctx.agencyId)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: "Tâche introuvable." };
  }

  const base = new Date(row.due_at as string);
  if (Number.isNaN(base.getTime())) {
    return { ok: false, error: "Échéance invalide." };
  }

  const addMs = preset === "7d" ? 7 * 86_400_000 : 86_400_000;
  const next = new Date(base.getTime() + addMs);

  const { error } = await supabase
    .from("agency_tasks")
    .update({ due_at: next.toISOString() })
    .eq("id", taskId)
    .eq("agency_id", ctx.agencyId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/taches");
  revalidatePath("/dashboard");
  if (row.contact_id) {
    revalidatePath(`/dashboard/contacts/${row.contact_id as string}`);
  }
  if (row.property_id) {
    revalidatePath(`/dashboard/biens/${row.property_id as string}`);
  }
  return { ok: true };
}

export async function deleteAgencyTask(taskId: string): Promise<TaskMutationResult> {
  const { supabase, ctx } = await requireAgencyContext();
  if (!ctx) {
    return { ok: false, error: "Session ou agence introuvable." };
  }

  const { data: row } = await supabase
    .from("agency_tasks")
    .select("contact_id")
    .eq("id", taskId)
    .eq("agency_id", ctx.agencyId)
    .maybeSingle();

  const { error } = await supabase
    .from("agency_tasks")
    .delete()
    .eq("id", taskId)
    .eq("agency_id", ctx.agencyId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/taches");
  revalidatePath("/dashboard");
  if (row?.contact_id) {
    revalidatePath(`/dashboard/contacts/${row.contact_id}`);
  }
  return { ok: true };
}
