import { createServiceSupabase } from "@/lib/supabase/admin";
import webpush from "web-push";

function requireCronAuth(request: Request): string | null {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return "CRON_SECRET manquant côté serveur.";
  const h = request.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice("Bearer ".length) : "";
  if (token !== secret) return "Non autorisé.";
  return null;
}

/** Vercel Cron appelle les routes en GET (Authorization: Bearer CRON_SECRET). */
export async function GET(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  const authErr = requireCronAuth(request);
  if (authErr) {
    return Response.json({ error: authErr }, { status: 401 });
  }

  const pub = process.env.VAPID_PUBLIC_KEY?.trim();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  const contact =
    process.env.VAPID_CONTACT_EMAIL?.trim() || "mailto:contact@immoai.local";

  if (!pub || !priv) {
    return Response.json({
      ok: true,
      skipped: true,
      reason: "VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY manquant.",
    });
  }

  const admin = createServiceSupabase();
  if (!admin) {
    return Response.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY manquant (requis pour le cron)." },
      { status: 503 }
    );
  }

  webpush.setVapidDetails(contact, pub, priv);

  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("user_id, subscription");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const horizon = new Date(Date.now() + 36 * 3600 * 1000).toISOString();
  let sent = 0;

  for (const row of subs ?? []) {
    const uid = row.user_id as string;
    const sub = row.subscription as webpush.PushSubscription;

    const { count: taskCount } = await admin
      .from("agency_tasks")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", uid)
      .is("completed_at", null)
      .lte("due_at", horizon);

    const { count: remCount } = await admin
      .from("contact_send_reminders")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", uid)
      .is("completed_at", null)
      .lte("remind_at", horizon);

    const tc = taskCount ?? 0;
    const rc = remCount ?? 0;
    if (tc === 0 && rc === 0) continue;

    const payload = JSON.stringify({
      title: "ImmoAI — rappels",
      body: `${tc} tâche(s) et ${rc} rappel(s) à traiter dans les prochaines 36 h.`,
    });

    try {
      await webpush.sendNotification(sub, payload);
      sent += 1;
    } catch {
      await admin.from("push_subscriptions").delete().eq("user_id", uid);
    }
  }

  return Response.json({ ok: true, sent });
}
