"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type AttachmentMutationResult =
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

const registerSchema = z.object({
  contactId: z.string().uuid(),
  storagePath: z.string().min(3).max(500),
  fileName: z.string().min(1).max(260),
  mimeType: z.string().max(120).optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
  label: z.string().max(200).optional(),
});

export async function registerContactAttachment(
  input: unknown
): Promise<AttachmentMutationResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Données invalides." };
  }

  const { supabase, ctx } = await requireAgencyContext();
  if (!ctx) {
    return { ok: false, error: "Session ou agence introuvable." };
  }

  const { contactId, storagePath, fileName, mimeType, sizeBytes, label } =
    parsed.data;

  const prefix = `${ctx.agencyId}/${contactId}/`;
  if (!storagePath.startsWith(prefix)) {
    return { ok: false, error: "Chemin de fichier invalide." };
  }

  const { data: contact } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("agency_id", ctx.agencyId)
    .maybeSingle();

  if (!contact) {
    return { ok: false, error: "Contact introuvable." };
  }

  const { error } = await supabase.from("contact_attachments").insert({
    agency_id: ctx.agencyId,
    contact_id: contactId,
    storage_path: storagePath,
    file_name: fileName,
    mime_type: mimeType?.trim() || null,
    size_bytes: sizeBytes ?? null,
    label: label?.trim() || null,
    created_by: ctx.userId,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/dashboard/contacts/${contactId}`);
  return { ok: true };
}

export async function deleteContactAttachment(
  attachmentId: string
): Promise<AttachmentMutationResult> {
  const { supabase, ctx } = await requireAgencyContext();
  if (!ctx) {
    return { ok: false, error: "Session ou agence introuvable." };
  }

  const { data: row, error: fetchErr } = await supabase
    .from("contact_attachments")
    .select("id, storage_path, contact_id")
    .eq("id", attachmentId)
    .eq("agency_id", ctx.agencyId)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: "Pièce jointe introuvable." };
  }

  const path = row.storage_path as string;
  const contactId = row.contact_id as string;

  const { error: rmErr } = await supabase.storage
    .from("contact-files")
    .remove([path]);

  if (rmErr) {
    return { ok: false, error: rmErr.message };
  }

  const { error: delErr } = await supabase
    .from("contact_attachments")
    .delete()
    .eq("id", attachmentId)
    .eq("agency_id", ctx.agencyId);

  if (delErr) {
    return { ok: false, error: delErr.message };
  }

  revalidatePath(`/dashboard/contacts/${contactId}`);
  return { ok: true };
}
