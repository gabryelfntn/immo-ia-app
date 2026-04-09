"use server";

import { createClient } from "@/lib/supabase/server";
import {
  propertyCreateSchema,
  propertyStatusEnum,
} from "@/lib/properties/schema";
import { revalidatePath } from "next/cache";

export type CreatePropertyResult =
  | { ok: true; propertyId: string; agencyId: string }
  | { ok: false; error: string };

export type InsertPropertyPhotosResult =
  | { ok: true }
  | { ok: false; error: string };

export type UpdatePropertyStatusResult =
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

export async function createProperty(
  input: unknown
): Promise<CreatePropertyResult> {
  const parsed = propertyCreateSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      Object.values(first).flat()[0] ?? "Données invalides.";
    return { ok: false, error: msg };
  }

  const { supabase, ctx } = await requireAgencyContext();
  if (!ctx) {
    return { ok: false, error: "Session ou agence introuvable." };
  }

  const { description, ...rest } = parsed.data;

  const { data: created, error } = await supabase
    .from("properties")
    .insert({
      ...rest,
      description: description?.trim() ? description.trim() : null,
      agency_id: ctx.agencyId,
      agent_id: ctx.userId,
      status: "disponible",
    })
    .select("id")
    .single();

  if (error || !created?.id) {
    return { ok: false, error: error?.message ?? "Création impossible." };
  }

  revalidatePath("/dashboard/biens");
  return {
    ok: true,
    propertyId: created.id,
    agencyId: ctx.agencyId,
  };
}

export async function insertPropertyPhotos(
  propertyId: string,
  photos: { url: string; is_main: boolean }[]
): Promise<InsertPropertyPhotosResult> {
  if (!photos.length) {
    return { ok: true };
  }

  const { supabase, ctx } = await requireAgencyContext();
  if (!ctx) {
    return { ok: false, error: "Session ou agence introuvable." };
  }

  const { data: prop, error: propError } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("agency_id", ctx.agencyId)
    .maybeSingle();

  if (propError || !prop) {
    return { ok: false, error: "Bien introuvable ou accès refusé." };
  }

  const rows = photos.map((p) => ({
    property_id: propertyId,
    url: p.url,
    is_main: p.is_main,
  }));

  const { error: insertError } = await supabase.from("property_photos").insert(rows);

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  const main = photos.find((p) => p.is_main) ?? photos[0];
  if (main?.url) {
    await supabase
      .from("properties")
      .update({ image_url: main.url })
      .eq("id", propertyId)
      .eq("agency_id", ctx.agencyId);
  }

  revalidatePath("/dashboard/biens");
  revalidatePath(`/dashboard/biens/${propertyId}`);
  return { ok: true };
}

export async function updatePropertyStatus(
  propertyId: string,
  status: unknown
): Promise<UpdatePropertyStatusResult> {
  const statusParsed = propertyStatusEnum.safeParse(status);
  if (!statusParsed.success) {
    return { ok: false, error: "Statut invalide." };
  }

  const { supabase, ctx } = await requireAgencyContext();
  if (!ctx) {
    return { ok: false, error: "Session ou agence introuvable." };
  }

  const { data, error } = await supabase
    .from("properties")
    .update({ status: statusParsed.data })
    .eq("id", propertyId)
    .eq("agency_id", ctx.agencyId)
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data?.length) {
    return { ok: false, error: "Bien introuvable." };
  }

  revalidatePath("/dashboard/biens");
  revalidatePath(`/dashboard/biens/${propertyId}`);
  return { ok: true };
}
