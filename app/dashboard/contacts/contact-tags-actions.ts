"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function requireAgencyContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, ctx: null as null | { agencyId: string } };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.agency_id) {
    return { supabase, ctx: null };
  }

  return { supabase, ctx: { agencyId: profile.agency_id } };
}

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "tag";
}

const createTagSchema = z.object({
  label: z.string().min(1).max(80),
  color: z.string().max(20).optional(),
});

export type TagMutationResult = { ok: true } | { ok: false; error: string };

export async function createAgencyTag(input: unknown): Promise<
  TagMutationResult & { tagId?: string }
> {
  const parsed = createTagSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Libellé invalide." };
  }

  const { supabase, ctx } = await requireAgencyContext();
  if (!ctx) {
    return { ok: false, error: "Session ou agence introuvable." };
  }

  const slug = slugify(parsed.data.label);
  const { data, error } = await supabase
    .from("contact_tags")
    .insert({
      agency_id: ctx.agencyId,
      slug,
      label: parsed.data.label.trim(),
      color: parsed.data.color?.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Un tag avec un libellé proche existe déjà." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/contacts");
  return { ok: true, tagId: data?.id as string };
}

export async function setContactTag(
  contactId: string,
  tagId: string,
  active: boolean
): Promise<TagMutationResult> {
  const { supabase, ctx } = await requireAgencyContext();
  if (!ctx) {
    return { ok: false, error: "Session ou agence introuvable." };
  }

  const { data: c } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("agency_id", ctx.agencyId)
    .maybeSingle();

  if (!c) {
    return { ok: false, error: "Contact introuvable." };
  }

  const { data: t } = await supabase
    .from("contact_tags")
    .select("id")
    .eq("id", tagId)
    .eq("agency_id", ctx.agencyId)
    .maybeSingle();

  if (!t) {
    return { ok: false, error: "Tag introuvable." };
  }

  if (active) {
    const { error } = await supabase.from("contact_tag_links").upsert(
      { contact_id: contactId, tag_id: tagId },
      { onConflict: "contact_id,tag_id", ignoreDuplicates: true }
    );
    if (error) {
      return { ok: false, error: error.message };
    }
  } else {
    const { error } = await supabase
      .from("contact_tag_links")
      .delete()
      .eq("contact_id", contactId)
      .eq("tag_id", tagId);
    if (error) {
      return { ok: false, error: error.message };
    }
  }

  revalidatePath("/dashboard/contacts");
  revalidatePath(`/dashboard/contacts/${contactId}`);
  return { ok: true };
}
