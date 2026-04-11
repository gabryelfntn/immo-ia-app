"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const addSchema = z.object({
  url: z.string().url().max(2000),
  events: z.array(z.string()).optional(),
});

export async function addWebhookEndpoint(formData: FormData): Promise<void> {
  const rawUrl = String(formData.get("url") ?? "").trim();
  const eventsRaw = String(formData.get("events") ?? "").trim();
  const events = eventsRaw
    ? eventsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const parsed = addSchema.safeParse({ url: rawUrl, events });
  if (!parsed.success) {
    return;
  }

  if (!parsed.data.url.startsWith("https://")) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return;
  }

  const { error } = await supabase.from("webhook_endpoints").insert({
    agency_id: profile.agency_id,
    created_by: user.id,
    url: parsed.data.url,
    events: parsed.data.events?.length ? parsed.data.events : [],
    is_active: true,
  });

  if (error) {
    return;
  }

  revalidatePath("/dashboard/integrations");
}

export async function deleteWebhookEndpoint(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const uuid = z.string().uuid().safeParse(id);
  if (!uuid.success) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return;
  }

  const { error } = await supabase
    .from("webhook_endpoints")
    .delete()
    .eq("id", uuid.data)
    .eq("agency_id", profile.agency_id);

  if (error) {
    return;
  }

  revalidatePath("/dashboard/integrations");
}
