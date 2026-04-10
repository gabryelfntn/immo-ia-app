import { createClient } from "@/lib/supabase/server";
import { callClaudeForFollowup } from "@/lib/followup/anthropic";
import { parseFollowupEmailJson } from "@/lib/followup/parse-response";
import {
  buildFollowupUserPrompt,
  type FollowupContact,
  type FollowupProperty,
} from "@/lib/followup/build-prompt";
import { sendEmailWithResend } from "@/lib/email/resend";

type ContactRow = {
  id: string;
  agency_id: string;
  agent_id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  type: string;
  budget_min: number | null;
  budget_max: number | null;
  desired_city: string | null;
  followup_opt_out: boolean;
  last_contacted_at: string | null;
  last_followup_sent_at: string | null;
  created_at: string;
};

function requireCronAuth(request: Request): string | null {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return "CRON_SECRET manquant côté serveur.";
  const h = request.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice("Bearer ".length) : "";
  if (token !== secret) return "Non autorisé.";
  return null;
}

function daysBetween(iso: string, nowMs: number): number {
  const t = new Date(iso).getTime();
  const diff = Math.max(0, nowMs - t);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function pickSuggestedProperties(args: {
  properties: {
    id: string;
    title: string;
    transaction: string;
    type: string;
    price: number;
    surface: number;
    city: string;
  }[];
  desiredCity: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
}): FollowupProperty[] {
  const { properties, desiredCity, budgetMin, budgetMax } = args;
  const city = desiredCity?.trim().toLowerCase() || null;

  const scored = properties.map((p) => {
    let score = 0;
    if (city && p.city.toLowerCase().includes(city)) score += 3;
    if (budgetMin != null && p.price >= budgetMin) score += 1;
    if (budgetMax != null && p.price <= budgetMax) score += 3;
    return { p, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ p }) => ({
      id: p.id,
      title: p.title,
      transaction: (p.transaction === "location" ? "location" : "vente") as
        | "vente"
        | "location",
      type: p.type,
      price: p.price,
      surface: p.surface,
      city: p.city,
    }));
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

  const fromEmail = process.env.FOLLOWUP_FROM_EMAIL?.trim();
  if (!fromEmail) {
    return Response.json(
      { error: "FOLLOWUP_FROM_EMAIL manquant." },
      { status: 500 }
    );
  }

  const minInactiveDays = Number(process.env.FOLLOWUP_MIN_INACTIVE_DAYS ?? 14);
  const minDaysBetweenEmails = Number(
    process.env.FOLLOWUP_MIN_DAYS_BETWEEN_EMAILS ?? 7
  );
  const maxPerRun = Number(process.env.FOLLOWUP_MAX_PER_RUN ?? 20);

  const nowIso = new Date().toISOString();
  const nowMs = Date.now();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ce endpoint cron doit tourner avec une session service role en prod
  // ou au minimum un user connecté. Si pas de user, on refuse.
  if (!user) {
    return Response.json(
      { error: "Cron sans session Supabase (config service role requise)." },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return Response.json({ error: "Agence introuvable." }, { status: 403 });
  }

  const agencyId = profile.agency_id as string;

  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select(
      "id, agency_id, agent_id, first_name, last_name, email, status, type, budget_min, budget_max, desired_city, followup_opt_out, last_contacted_at, last_followup_sent_at, created_at"
    )
    .eq("agency_id", agencyId)
    .eq("followup_opt_out", false)
    .order("created_at", { ascending: false })
    .limit(500);

  if (contactsError) {
    return Response.json({ error: contactsError.message }, { status: 500 });
  }

  const contactRows = (contacts ?? []) as unknown as ContactRow[];

  const eligible = contactRows
    .map((c) => {
      const lastActivity = c.last_contacted_at ?? c.created_at;
      const inactiveDays = daysBetween(lastActivity, nowMs);
      const lastFollowupDays =
        c.last_followup_sent_at != null
          ? daysBetween(c.last_followup_sent_at, nowMs)
          : Number.POSITIVE_INFINITY;
      return { c, inactiveDays, lastFollowupDays };
    })
    .filter(
      ({ inactiveDays, lastFollowupDays }) =>
        inactiveDays >= minInactiveDays &&
        lastFollowupDays >= minDaysBetweenEmails
    )
    .sort((a, b) => b.inactiveDays - a.inactiveDays)
    .slice(0, maxPerRun);

  // Précharge des biens disponibles une fois
  const { data: props, error: propError } = await supabase
    .from("properties")
    .select("id, title, transaction, type, price, surface, city")
    .eq("agency_id", agencyId)
    .eq("status", "disponible")
    .limit(80);

  if (propError) {
    return Response.json({ error: propError.message }, { status: 500 });
  }

  const propertyPool =
    (props ?? []).map((p) => ({
      id: p.id as string,
      title: p.title as string,
      transaction: p.transaction as string,
      type: p.type as string,
      price: Number(p.price),
      surface: Number(p.surface),
      city: p.city as string,
    })) ?? [];

  let sent = 0;
  let failed = 0;
  const results: { contactId: string; status: "sent" | "failed"; error?: string }[] =
    [];

  for (const item of eligible) {
    const c = item.c;

    const contact: FollowupContact = {
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email,
      status: c.status,
      type: c.type,
      budget_min: c.budget_min != null ? Number(c.budget_min) : null,
      budget_max: c.budget_max != null ? Number(c.budget_max) : null,
      desired_city: c.desired_city,
      last_contacted_at: c.last_contacted_at,
      created_at: c.created_at,
    };

    const suggested = pickSuggestedProperties({
      properties: propertyPool,
      desiredCity: contact.desired_city,
      budgetMin: contact.budget_min,
      budgetMax: contact.budget_max,
    });

    const userPrompt = buildFollowupUserPrompt({ contact, properties: suggested });

    try {
      const assistantText = await callClaudeForFollowup(userPrompt);
      const email = parseFollowupEmailJson(assistantText);

      const sendRes = await sendEmailWithResend({
        to: contact.email,
        from: fromEmail,
        subject: email.subject,
        text: email.body,
      });

      await supabase.from("followup_emails").insert({
        agency_id: agencyId,
        agent_id: c.agent_id,
        contact_id: c.id,
        subject: email.subject,
        body: email.body,
        tone: email.tone,
        provider: "resend",
        provider_message_id: sendRes.messageId,
        status: "sent",
        error: null,
      });

      await supabase
        .from("contacts")
        .update({ last_followup_sent_at: nowIso })
        .eq("id", c.id)
        .eq("agency_id", agencyId);

      sent += 1;
      results.push({ contactId: c.id, status: "sent" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      failed += 1;
      results.push({ contactId: c.id, status: "failed", error: msg });

      await supabase.from("followup_emails").insert({
        agency_id: agencyId,
        agent_id: c.agent_id,
        contact_id: c.id,
        subject: "(failed)",
        body: "",
        tone: null,
        provider: "resend",
        provider_message_id: null,
        status: "failed",
        error: msg,
      });
    }
  }

  return Response.json({
    ok: true,
    agencyId,
    minInactiveDays,
    minDaysBetweenEmails,
    maxPerRun,
    eligible: eligible.length,
    sent,
    failed,
    results,
  });
}

