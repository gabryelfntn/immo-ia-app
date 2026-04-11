"use server";

import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit/log";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const linkTypeEnum = z.enum(["favori", "visite_prevue", "offre", "autre"]);

export type LinkMutationResult = { ok: true } | { ok: false; error: string };

export async function addContactPropertyLink(input: unknown): Promise<LinkMutationResult> {
  const schema = z.object({
    contactId: z.string().uuid(),
    propertyId: z.string().uuid(),
    linkType: linkTypeEnum,
    note: z.string().max(500).optional(),
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Données invalides." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Non authentifié." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return { ok: false, error: "Agence introuvable." };
  }

  const { error } = await supabase.from("contact_property_links").insert({
    agency_id: profile.agency_id,
    contact_id: parsed.data.contactId,
    property_id: parsed.data.propertyId,
    agent_id: user.id,
    link_type: parsed.data.linkType,
    note: parsed.data.note?.trim() || null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  await logAuditEvent(supabase, {
    agencyId: profile.agency_id,
    actorId: user.id,
    entityType: "contact_property_link",
    entityId: parsed.data.contactId,
    action: "create",
    payload: {
      property_id: parsed.data.propertyId,
      link_type: parsed.data.linkType,
    },
  });

  revalidatePath(`/dashboard/contacts/${parsed.data.contactId}`);
  revalidatePath(`/dashboard/biens/${parsed.data.propertyId}`);
  return { ok: true };
}

export async function removeContactPropertyLink(
  linkId: string,
  contactId: string,
  propertyId: string
): Promise<LinkMutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Non authentifié." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return { ok: false, error: "Agence introuvable." };
  }

  const { error } = await supabase
    .from("contact_property_links")
    .delete()
    .eq("id", linkId)
    .eq("agency_id", profile.agency_id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await logAuditEvent(supabase, {
    agencyId: profile.agency_id,
    actorId: user.id,
    entityType: "contact_property_link",
    entityId: contactId,
    action: "delete",
    payload: { property_id: propertyId },
  });

  revalidatePath(`/dashboard/contacts/${contactId}`);
  revalidatePath(`/dashboard/biens/${propertyId}`);
  return { ok: true };
}
