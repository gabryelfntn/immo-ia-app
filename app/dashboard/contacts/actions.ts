"use server";

import { createClient } from "@/lib/supabase/server";
import {
  contactCreateSchema,
  contactStatusEnum,
} from "@/lib/contacts/schema";
import { revalidatePath } from "next/cache";

export type CreateContactResult =
  | { ok: true; contactId: string }
  | { ok: false; error: string };

export type UpdateContactStatusResult =
  | { ok: true }
  | { ok: false; error: string };

export type UpdateContactNotesResult =
  | { ok: true }
  | { ok: false; error: string };

export type UpdateFollowupOptOutResult =
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

export async function createContact(
  input: unknown
): Promise<CreateContactResult> {
  const parsed = contactCreateSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat()[0] ?? "Données invalides.";
    return { ok: false, error: msg };
  }

  const { supabase, ctx } = await requireAgencyContext();
  if (!ctx) {
    return { ok: false, error: "Session ou agence introuvable." };
  }

  const {
    budget_min,
    budget_max,
    desired_city,
    notes,
    ...rest
  } = parsed.data;

  const { data: created, error } = await supabase
    .from("contacts")
    .insert({
      ...rest,
      budget_min: budget_min ?? null,
      budget_max: budget_max ?? null,
      desired_city: desired_city ?? null,
      notes: notes ?? null,
      agency_id: ctx.agencyId,
      agent_id: ctx.userId,
    })
    .select("id")
    .single();

  if (error || !created?.id) {
    return { ok: false, error: error?.message ?? "Création impossible." };
  }

  revalidatePath("/dashboard/contacts");
  return { ok: true, contactId: created.id };
}

export async function updateContactStatus(
  contactId: string,
  status: unknown
): Promise<UpdateContactStatusResult> {
  const statusParsed = contactStatusEnum.safeParse(status);
  if (!statusParsed.success) {
    return { ok: false, error: "Statut invalide." };
  }

  const { supabase, ctx } = await requireAgencyContext();
  if (!ctx) {
    return { ok: false, error: "Session ou agence introuvable." };
  }

  const { data, error } = await supabase
    .from("contacts")
    .update({ status: statusParsed.data, updated_at: new Date().toISOString() })
    .eq("id", contactId)
    .eq("agency_id", ctx.agencyId)
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data?.length) {
    return { ok: false, error: "Contact introuvable." };
  }

  revalidatePath("/dashboard/contacts");
  revalidatePath(`/dashboard/contacts/${contactId}`);
  return { ok: true };
}

export async function updateContactNotes(
  contactId: string,
  notes: string
): Promise<UpdateContactNotesResult> {
  const trimmed = notes.trim();
  if (trimmed.length > 10000) {
    return { ok: false, error: "Les notes sont trop longues." };
  }

  const { supabase, ctx } = await requireAgencyContext();
  if (!ctx) {
    return { ok: false, error: "Session ou agence introuvable." };
  }

  const { data, error } = await supabase
    .from("contacts")
    .update({
      notes: trimmed.length ? trimmed : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contactId)
    .eq("agency_id", ctx.agencyId)
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data?.length) {
    return { ok: false, error: "Contact introuvable." };
  }

  revalidatePath("/dashboard/contacts");
  revalidatePath(`/dashboard/contacts/${contactId}`);
  return { ok: true };
}

export async function updateFollowupOptOut(
  contactId: string,
  optOut: boolean
): Promise<UpdateFollowupOptOutResult> {
  const { supabase, ctx } = await requireAgencyContext();
  if (!ctx) {
    return { ok: false, error: "Session ou agence introuvable." };
  }

  const { data, error } = await supabase
    .from("contacts")
    .update({
      followup_opt_out: optOut,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contactId)
    .eq("agency_id", ctx.agencyId)
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data?.length) {
    return { ok: false, error: "Contact introuvable." };
  }

  revalidatePath("/dashboard/contacts");
  revalidatePath(`/dashboard/contacts/${contactId}`);
  revalidatePath("/dashboard/relances");
  revalidatePath("/dashboard/relances/historique");
  return { ok: true };
}
