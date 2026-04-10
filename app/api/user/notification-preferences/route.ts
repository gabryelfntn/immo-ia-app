import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return Response.json({ error: "Agence introuvable." }, { status: 403 });
  }

  const { data } = await supabase
    .from("notification_preferences")
    .select("push_digest_hour_utc, push_mute_weekends")
    .eq("user_id", user.id)
    .maybeSingle();

  return Response.json({
    push_digest_hour_utc: data?.push_digest_hour_utc ?? 7,
    push_mute_weekends: data?.push_mute_weekends ?? false,
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return Response.json({ error: "Agence introuvable." }, { status: 403 });
  }

  const raw = (await request.json().catch(() => ({}))) as {
    push_digest_hour_utc?: number;
    push_mute_weekends?: boolean;
  };

  const hour = Number(raw.push_digest_hour_utc);
  const mute = Boolean(raw.push_mute_weekends);

  if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
    return Response.json({ error: "Heure UTC invalide (0–23)." }, { status: 400 });
  }

  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: user.id,
      agency_id: profile.agency_id,
      push_digest_hour_utc: hour,
      push_mute_weekends: mute,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
