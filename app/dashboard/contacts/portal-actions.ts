"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generatePortalToken, hashPortalToken } from "@/lib/client-portal/token";
import { runMatchForContact } from "@/lib/matching/run-match-for-contact";

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

const PORTAL_TTL_DAYS = 60;

export type CreatePortalLinkResult =
  | { ok: true; url: string; expiresAt: string }
  | { ok: false; error: string };

export async function createClientPortalLink(
  contactId: string
): Promise<CreatePortalLinkResult> {
  const { supabase, ctx } = await requireAgencyContext();
  if (!ctx) {
    return { ok: false, error: "Session ou agence introuvable." };
  }

  const { data: contact, error: cErr } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("agency_id", ctx.agencyId)
    .maybeSingle();

  if (cErr || !contact) {
    return { ok: false, error: "Contact introuvable." };
  }

  const now = new Date();
  await supabase
    .from("client_portal_access")
    .update({ revoked_at: now.toISOString() })
    .eq("contact_id", contactId)
    .is("revoked_at", null);

  const raw = generatePortalToken();
  const token_hash = hashPortalToken(raw);
  const expires = new Date(now.getTime() + PORTAL_TTL_DAYS * 86400_000);

  const { error: insErr } = await supabase.from("client_portal_access").insert({
    contact_id: contactId,
    token_hash,
    expires_at: expires.toISOString(),
  });

  if (insErr) {
    return { ok: false, error: insErr.message };
  }

  revalidatePath(`/dashboard/contacts/${contactId}`);
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (typeof process.env.VERCEL_URL === "string" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "");
  const path = `/client/${raw}`;
  const url = base ? `${base}${path}` : path;

  return {
    ok: true,
    url,
    expiresAt: expires.toISOString(),
  };
}

export type SyncPortalResult = { ok: true } | { ok: false; error: string };

export async function syncClientPortalProposals(
  contactId: string
): Promise<SyncPortalResult> {
  const { supabase, ctx } = await requireAgencyContext();
  if (!ctx) {
    return { ok: false, error: "Session ou agence introuvable." };
  }

  const { data: contact, error: cErr } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("agency_id", ctx.agencyId)
    .maybeSingle();

  if (cErr || !contact) {
    return { ok: false, error: "Contact introuvable." };
  }

  const match = await runMatchForContact(supabase, ctx.agencyId, contactId);
  if (!match.ok) {
    return { ok: false, error: match.error };
  }

  const { data: active } = await supabase
    .from("client_portal_access")
    .select("id")
    .eq("contact_id", contactId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!active?.id) {
    return {
      ok: false,
      error: "Créez d’abord un lien portail pour ce contact.",
    };
  }

  const { error: upErr } = await supabase
    .from("client_portal_access")
    .update({
      match_snapshot: match.matches as unknown as Record<string, unknown>[],
      snapshot_updated_at: new Date().toISOString(),
    })
    .eq("id", active.id);

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  revalidatePath(`/dashboard/contacts/${contactId}`);
  return { ok: true };
}
