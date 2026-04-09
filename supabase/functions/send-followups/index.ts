import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type FollowupEmail = { subject: string; body: string; tone: string };

const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

function json(res: unknown, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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
}) {
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
      transaction: p.transaction === "location" ? "location" : "vente",
      type: p.type,
      price: p.price,
      surface: p.surface,
      city: p.city,
    }));
}

function buildFollowupPrompt(args: {
  contact: {
    first_name: string;
    last_name: string;
    email: string;
    status: string;
    type: string;
    budget_min: number | null;
    budget_max: number | null;
    desired_city: string | null;
    last_contacted_at: string | null;
    created_at: string;
  };
  properties: ReturnType<typeof pickSuggestedProperties>;
}) {
  const { contact, properties } = args;
  const name = `${contact.first_name} ${contact.last_name}`.trim();
  const lastActivityISO = contact.last_contacted_at ?? contact.created_at;
  const days = daysBetween(lastActivityISO, Date.now());

  const fmtBudget = (min: number | null, max: number | null) => {
    if (min == null && max == null) return "Non renseigné";
    const fmt = (n: number) =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(n);
    if (min != null && max != null) return `${fmt(min)} — ${fmt(max)}`;
    if (min != null) return `À partir de ${fmt(min)}`;
    return `Jusqu’à ${fmt(max!)}`;
  };

  const propsLines =
    properties.length === 0
      ? "Aucun bien n'a été pré-sélectionné."
      : properties
          .map((p, i) =>
            [
              `--- Bien ${i + 1} ---`,
              `Titre: ${p.title}`,
              `Type: ${p.type}`,
              `Transaction: ${p.transaction}`,
              `Prix: ${p.price} EUR`,
              `Surface: ${p.surface} m²`,
              `Ville: ${p.city}`,
            ].join("\n")
          )
          .join("\n\n");

  return [
    "Rédige un email de relance pour un contact CRM devenu inactif.",
    "Objectif: reprendre contact de façon naturelle et proposer de l'aide ou 1-3 biens pertinents si disponibles.",
    "Ne pas être insistant. Évite les phrases trop génériques.",
    "",
    "=== CONTACT ===",
    `Nom: ${name}`,
    `Email: ${contact.email}`,
    `Type CRM: ${contact.type}`,
    `Statut pipeline: ${contact.status}`,
    `Budget: ${fmtBudget(contact.budget_min, contact.budget_max)}`,
    `Ville recherchée: ${contact.desired_city ?? "Non renseignée"}`,
    `Jours sans contact: ${days}`,
    "",
    "=== BIENS SUGGÉRÉS (si pertinents) ===",
    propsLines,
    "",
    "Réponds en JSON avec { subject, body, tone } uniquement.",
  ].join("\n");
}

async function callAnthropic(args: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
}) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": args.apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: args.model,
      max_tokens: 2048,
      system: args.system,
      messages: [{ role: "user", content: args.user }],
    }),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`Anthropic: ${res.status} — ${raw}`);
  const data = JSON.parse(raw) as { content?: { type: string; text?: string }[] };
  const text = data.content?.find((c) => c.type === "text")?.text?.trim();
  if (!text) throw new Error("Anthropic: réponse sans texte.");
  return text;
}

function extractJsonObject(text: string) {
  let t = text.trim();
  const fence = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```$/im.exec(t);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("JSON introuvable dans la réponse du modèle.");
  }
  return JSON.parse(t.slice(start, end + 1));
}

async function sendResend(args: {
  apiKey: string;
  to: string;
  from: string;
  subject: string;
  text: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: args.to,
      from: args.from,
      subject: args.subject,
      text: args.text,
    }),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`Resend: ${res.status} — ${raw}`);
  const data = JSON.parse(raw) as { id?: string };
  if (!data?.id) throw new Error("Resend: réponse invalide.");
  return data.id;
}

const FOLLOWUP_SYSTEM_PROMPT =
  "Tu es un agent immobilier français professionnel et chaleureux. Tu rédiges des emails de relance personnalisés, naturels et non génériques. Réponds en JSON : { subject: string, body: string, tone: string }";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Secret optionnel pour déclenchement manuel
  const cronSecret = Deno.env.get("CRON_SECRET")?.trim();
  const auth = req.headers.get("authorization") ?? "";
  if (cronSecret) {
    const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
    if (token !== cronSecret) {
      return json({ error: "Non autorisé." }, 401);
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")?.trim();
  const resendKey = Deno.env.get("RESEND_API_KEY")?.trim();
  const fromEmail = Deno.env.get("FOLLOWUP_FROM_EMAIL")?.trim();

  if (!supabaseUrl || !serviceRole) {
    return json({ error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquant." }, 500);
  }
  if (!anthropicKey) return json({ error: "ANTHROPIC_API_KEY manquant." }, 500);
  if (!resendKey) return json({ error: "RESEND_API_KEY manquant." }, 500);
  if (!fromEmail) return json({ error: "FOLLOWUP_FROM_EMAIL manquant." }, 500);

  const minInactiveDays = Number(Deno.env.get("FOLLOWUP_MIN_INACTIVE_DAYS") ?? 14);
  const minDaysBetweenEmails = Number(
    Deno.env.get("FOLLOWUP_MIN_DAYS_BETWEEN_EMAILS") ?? 7,
  );
  const maxPerRun = Number(Deno.env.get("FOLLOWUP_MAX_PER_RUN") ?? 20);
  const model = Deno.env.get("ANTHROPIC_MODEL")?.trim() || DEFAULT_MODEL;

  const supabase = createClient(supabaseUrl, serviceRole);
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();

  const { data: properties, error: propErr } = await supabase
    .from("properties")
    .select("id, title, transaction, type, price, surface, city, agency_id")
    .eq("status", "disponible")
    .limit(200);
  if (propErr) return json({ error: propErr.message }, 500);

  // Charge des contacts potentiels (toutes agences)
  const { data: contacts, error: cErr } = await supabase
    .from("contacts")
    .select(
      "id, agency_id, agent_id, first_name, last_name, email, status, type, budget_min, budget_max, desired_city, followup_opt_out, last_contacted_at, last_followup_sent_at, created_at"
    )
    .eq("followup_opt_out", false)
    .limit(2000);

  if (cErr) return json({ error: cErr.message }, 500);

  const byAgencyProps = new Map<string, any[]>();
  for (const p of properties ?? []) {
    const agencyId = (p as any).agency_id as string;
    const arr = byAgencyProps.get(agencyId) ?? [];
    arr.push({
      id: (p as any).id as string,
      title: (p as any).title as string,
      transaction: (p as any).transaction as string,
      type: (p as any).type as string,
      price: Number((p as any).price),
      surface: Number((p as any).surface),
      city: (p as any).city as string,
    });
    byAgencyProps.set(agencyId, arr);
  }

  const eligible = (contacts ?? [])
    .map((c: any) => {
      const lastActivity = c.last_contacted_at ?? c.created_at;
      const inactiveDays = daysBetween(lastActivity, nowMs);
      const lastFollowupDays =
        c.last_followup_sent_at ? daysBetween(c.last_followup_sent_at, nowMs) : 999999;
      return { c, inactiveDays, lastFollowupDays };
    })
    .filter((x) => x.inactiveDays >= minInactiveDays && x.lastFollowupDays >= minDaysBetweenEmails)
    .sort((a, b) => b.inactiveDays - a.inactiveDays)
    .slice(0, maxPerRun);

  let sent = 0;
  let failed = 0;
  const results: any[] = [];

  for (const item of eligible) {
    const c: any = item.c;
    const agencyProps = byAgencyProps.get(c.agency_id) ?? [];

    const suggested = pickSuggestedProperties({
      properties: agencyProps,
      desiredCity: c.desired_city ?? null,
      budgetMin: c.budget_min != null ? Number(c.budget_min) : null,
      budgetMax: c.budget_max != null ? Number(c.budget_max) : null,
    });

    const prompt = buildFollowupPrompt({
      contact: {
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        status: c.status,
        type: c.type,
        budget_min: c.budget_min != null ? Number(c.budget_min) : null,
        budget_max: c.budget_max != null ? Number(c.budget_max) : null,
        desired_city: c.desired_city ?? null,
        last_contacted_at: c.last_contacted_at ?? null,
        created_at: c.created_at,
      },
      properties: suggested,
    });

    try {
      const assistantText = await callAnthropic({
        apiKey: anthropicKey,
        model,
        system: FOLLOWUP_SYSTEM_PROMPT,
        user: prompt,
      });
      const parsed = extractJsonObject(assistantText) as FollowupEmail;
      if (!parsed?.subject || !parsed?.body) throw new Error("Email JSON invalide.");

      const messageId = await sendResend({
        apiKey: resendKey,
        to: c.email,
        from: fromEmail,
        subject: parsed.subject,
        text: parsed.body,
      });

      await supabase.from("followup_emails").insert({
        agency_id: c.agency_id,
        agent_id: c.agent_id,
        contact_id: c.id,
        subject: parsed.subject,
        body: parsed.body,
        tone: parsed.tone ?? "chaleureux",
        provider: "resend",
        provider_message_id: messageId,
        status: "sent",
        error: null,
      });

      await supabase.from("contacts").update({ last_followup_sent_at: nowIso }).eq("id", c.id);

      sent += 1;
      results.push({ contactId: c.id, status: "sent", messageId });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      failed += 1;
      results.push({ contactId: c.id, status: "failed", error: msg });
      await supabase.from("followup_emails").insert({
        agency_id: c.agency_id,
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

  return json({
    ok: true,
    minInactiveDays,
    minDaysBetweenEmails,
    maxPerRun,
    eligible: eligible.length,
    sent,
    failed,
    results,
  });
});

