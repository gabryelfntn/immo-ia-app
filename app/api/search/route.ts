import { createClient } from "@/lib/supabase/server";
import { normalizeRole, isAgentOnly } from "@/lib/auth/agency-scope";

/** Escape % and _ so user input is literal in ILIKE. */
function ilikePattern(raw: string): string {
  const escaped = raw
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
  return `%${escaped}%`;
}

const MAX_EACH = 6;

type PropertyRow = {
  id: string;
  title: string;
  city: string;
  status: string;
};

type ContactRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  type: string;
};

type ListingRow = {
  id: string;
  property_id: string;
  property_title: string;
  property_city: string;
};

type VisitRow = {
  id: string;
  visit_date: string;
  summary_line: string;
  property_title: string | null;
  property_city: string | null;
  contact_name: string | null;
  contact_id: string;
};

type TaskRow = {
  id: string;
  title: string;
  due_at: string;
  contact_id: string | null;
  agent_id: string;
};

type FollowupRow = {
  id: string;
  subject: string;
  contact_id: string;
  contact_name: string | null;
};

type EmptyPayload = {
  properties: PropertyRow[];
  contacts: ContactRow[];
  listings: ListingRow[];
  visits: VisitRow[];
  tasks: TaskRow[];
  followups: FollowupRow[];
};

function mergeUnique<T extends { id: string }>(rows: T[][], cap: number): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const group of rows) {
    for (const row of group ?? []) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        out.push(row);
        if (out.length >= cap) return out;
      }
    }
  }
  return out;
}

function mapListing(r: Record<string, unknown>): ListingRow {
  const props = r.properties as { title?: string; city?: string } | null;
  return {
    id: r.id as string,
    property_id: r.property_id as string,
    property_title: props?.title?.trim() || "Bien",
    property_city: props?.city?.trim() || "",
  };
}

function mapVisit(r: Record<string, unknown>): VisitRow {
  const p = r.properties as { title?: string; city?: string } | null;
  const c = r.contacts as { first_name?: string; last_name?: string } | null;
  const summary = String(r.summary ?? "");
  return {
    id: r.id as string,
    visit_date: r.visit_date as string,
    summary_line:
      summary.length > 140 ? `${summary.slice(0, 137)}…` : summary,
    property_title: p?.title?.trim() ?? null,
    property_city: p?.city?.trim() ?? null,
    contact_name: c
      ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || null
      : null,
    contact_id: r.contact_id as string,
  };
}

function mapFollowup(r: Record<string, unknown>): FollowupRow {
  const c = r.contacts as { first_name?: string; last_name?: string } | null;
  return {
    id: r.id as string,
    subject: String(r.subject ?? ""),
    contact_id: r.contact_id as string,
    contact_name: c
      ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || null
      : null,
  };
}

const listingSelect = "id, property_id, properties ( title, city )";
const visitSelect = `
  id,
  visit_date,
  summary,
  contact_id,
  properties ( title, city ),
  contacts ( first_name, last_name )
`;
const followupSelect = `
  id,
  subject,
  contact_id,
  contacts ( first_name, last_name )
`;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("q")?.trim() ?? "";
  const empty: EmptyPayload = {
    properties: [],
    contacts: [],
    listings: [],
    visits: [],
    tasks: [],
    followups: [],
  };

  if (raw.length < 2) {
    return Response.json(empty);
  }

  const q = raw.replace(/,/g, " ").slice(0, 120);
  const pat = ilikePattern(q);

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("agency_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.agency_id) {
    return Response.json({ error: "Agence introuvable." }, { status: 403 });
  }

  const agencyId = profile.agency_id;
  const agentId = isAgentOnly(
    normalizeRole(typeof profile.role === "string" ? profile.role : null)
  )
    ? user.id
    : null;

  const propSelect = "id, title, city, status";
  const taskSelect = "id, title, due_at, contact_id, agent_id";

  const settled = await Promise.allSettled([
    supabase
      .from("properties")
      .select(propSelect)
      .eq("agency_id", agencyId)
      .ilike("title", pat)
      .order("created_at", { ascending: false })
      .limit(MAX_EACH),
    supabase
      .from("properties")
      .select(propSelect)
      .eq("agency_id", agencyId)
      .ilike("city", pat)
      .order("created_at", { ascending: false })
      .limit(MAX_EACH),
    supabase
      .from("properties")
      .select(propSelect)
      .eq("agency_id", agencyId)
      .ilike("address", pat)
      .order("created_at", { ascending: false })
      .limit(MAX_EACH),
    supabase
      .from("properties")
      .select(propSelect)
      .eq("agency_id", agencyId)
      .ilike("description", pat)
      .order("created_at", { ascending: false })
      .limit(MAX_EACH),
    supabase
      .from("contacts")
      .select("id, first_name, last_name, email, type")
      .eq("agency_id", agencyId)
      .ilike("first_name", pat)
      .order("created_at", { ascending: false })
      .limit(MAX_EACH),
    supabase
      .from("contacts")
      .select("id, first_name, last_name, email, type")
      .eq("agency_id", agencyId)
      .ilike("last_name", pat)
      .order("created_at", { ascending: false })
      .limit(MAX_EACH),
    supabase
      .from("contacts")
      .select("id, first_name, last_name, email, type")
      .eq("agency_id", agencyId)
      .ilike("email", pat)
      .order("created_at", { ascending: false })
      .limit(MAX_EACH),
    supabase
      .from("contacts")
      .select("id, first_name, last_name, email, type")
      .eq("agency_id", agencyId)
      .ilike("phone", pat)
      .order("created_at", { ascending: false })
      .limit(MAX_EACH),
    supabase
      .from("contacts")
      .select("id, first_name, last_name, email, type")
      .eq("agency_id", agencyId)
      .ilike("notes", pat)
      .order("created_at", { ascending: false })
      .limit(MAX_EACH),
    supabase
      .from("generated_listings")
      .select(listingSelect)
      .eq("agency_id", agencyId)
      .ilike("classique", pat)
      .order("created_at", { ascending: false })
      .limit(MAX_EACH),
    supabase
      .from("generated_listings")
      .select(listingSelect)
      .eq("agency_id", agencyId)
      .ilike("dynamique", pat)
      .order("created_at", { ascending: false })
      .limit(MAX_EACH),
    supabase
      .from("generated_listings")
      .select(listingSelect)
      .eq("agency_id", agencyId)
      .ilike("premium", pat)
      .order("created_at", { ascending: false })
      .limit(MAX_EACH),
    supabase
      .from("visit_reports")
      .select(visitSelect)
      .eq("agency_id", agencyId)
      .ilike("summary", pat)
      .order("visit_date", { ascending: false })
      .limit(MAX_EACH),
    supabase
      .from("visit_reports")
      .select(visitSelect)
      .eq("agency_id", agencyId)
      .ilike("recommendation", pat)
      .order("visit_date", { ascending: false })
      .limit(MAX_EACH),
    supabase
      .from("visit_reports")
      .select(visitSelect)
      .eq("agency_id", agencyId)
      .ilike("next_step", pat)
      .order("visit_date", { ascending: false })
      .limit(MAX_EACH),
    supabase
      .from("visit_reports")
      .select(visitSelect)
      .eq("agency_id", agencyId)
      .ilike("raw_notes", pat)
      .order("visit_date", { ascending: false })
      .limit(MAX_EACH),
    supabase
      .from("agency_tasks")
      .select(taskSelect)
      .eq("agency_id", agencyId)
      .ilike("title", pat)
      .order("due_at", { ascending: true })
      .limit(MAX_EACH),
    supabase
      .from("agency_tasks")
      .select(taskSelect)
      .eq("agency_id", agencyId)
      .ilike("notes", pat)
      .order("due_at", { ascending: true })
      .limit(MAX_EACH),
    supabase
      .from("followup_emails")
      .select(followupSelect)
      .eq("agency_id", agencyId)
      .ilike("subject", pat)
      .order("created_at", { ascending: false })
      .limit(MAX_EACH),
    supabase
      .from("followup_emails")
      .select(followupSelect)
      .eq("agency_id", agencyId)
      .ilike("body", pat)
      .order("created_at", { ascending: false })
      .limit(MAX_EACH),
  ]);

  function row<T>(i: number): T[] {
    const r = settled[i];
    if (r.status !== "fulfilled") return [];
    const v = r.value;
    if (v.error) return [];
    if (!Array.isArray(v.data) || v.data == null) return [];
    return v.data as T[];
  }

  function queryFailed(i: number): boolean {
    const r = settled[i];
    if (r.status !== "fulfilled") return true;
    return Boolean(r.value.error);
  }

  const coreFailed = [0, 1, 2, 3, 4, 5, 6, 7, 8].every((i) => queryFailed(i));
  if (coreFailed) {
    const firstErr = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
      const r = settled[i];
      if (r.status === "fulfilled" && r.value.error)
        return r.value.error.message;
      return null;
    }).find(Boolean);
    return Response.json(
      { error: firstErr ?? "Erreur de recherche." },
      { status: 500 }
    );
  }

  const properties = mergeUnique<PropertyRow>(
    [
      row<PropertyRow>(0),
      row<PropertyRow>(1),
      row<PropertyRow>(2),
      row<PropertyRow>(3),
    ],
    MAX_EACH
  );

  const contacts = mergeUnique<ContactRow>(
    [
      row<ContactRow>(4),
      row<ContactRow>(5),
      row<ContactRow>(6),
      row<ContactRow>(7),
      row<ContactRow>(8),
    ],
    MAX_EACH
  );

  const listingGroups = [
    row<Record<string, unknown>>(9),
    row<Record<string, unknown>>(10),
    row<Record<string, unknown>>(11),
  ].map((g) => g.map(mapListing));

  const listings = mergeUnique<ListingRow>(listingGroups, MAX_EACH);

  const visitGroups = [
    row<Record<string, unknown>>(12),
    row<Record<string, unknown>>(13),
    row<Record<string, unknown>>(14),
    row<Record<string, unknown>>(15),
  ].map((g) => g.map(mapVisit));

  const visits = mergeUnique<VisitRow>(visitGroups, MAX_EACH);

  const taskGroups = [row<TaskRow>(16), row<TaskRow>(17)];
  const tasks = mergeUnique<TaskRow>(taskGroups, MAX_EACH);

  const followupGroups = [
    row<Record<string, unknown>>(18).map(mapFollowup),
    row<Record<string, unknown>>(19).map(mapFollowup),
  ];
  const followups = mergeUnique<FollowupRow>(followupGroups, MAX_EACH);

  let outProps = properties;
  let outConts = contacts;
  let outListings = listings;
  let outVisits = visits;
  let outTasks = tasks;
  let outFollowups = followups;

  if (agentId) {
    const [{ data: ap }, { data: ac }] = await Promise.all([
      supabase
        .from("properties")
        .select("id")
        .eq("agency_id", agencyId)
        .eq("agent_id", agentId),
      supabase
        .from("contacts")
        .select("id")
        .eq("agency_id", agencyId)
        .eq("agent_id", agentId),
    ]);
    const pSet = new Set((ap ?? []).map((p) => p.id as string));
    const cSet = new Set((ac ?? []).map((c) => c.id as string));
    outProps = properties.filter((p) => pSet.has(p.id));
    outConts = contacts.filter((c) => cSet.has(c.id));
    outListings = listings.filter((l) => pSet.has(l.property_id));
    outVisits = visits.filter((v) => cSet.has(v.contact_id));
    outTasks = tasks.filter((t) => t.agent_id === agentId);
    outFollowups = followups.filter((f) => cSet.has(f.contact_id));
  }

  return Response.json({
    properties: outProps,
    contacts: outConts,
    listings: outListings,
    visits: outVisits.map(
      ({
        id,
        visit_date,
        summary_line,
        property_title,
        property_city,
        contact_name,
      }) => ({
        id,
        visit_date,
        summary_line,
        property_title,
        property_city,
        contact_name,
      })
    ),
    tasks: outTasks.map(({ id, title, due_at, contact_id }) => ({
      id,
      title,
      due_at,
      contact_id,
    })),
    followups: outFollowups,
  });
}
