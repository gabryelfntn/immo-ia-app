import { createClient } from "@/lib/supabase/server";

/** Escape % and _ so user input is literal in ILIKE. */
function ilikePattern(raw: string): string {
  const escaped = raw
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
  return `%${escaped}%`;
}

const MAX_EACH = 8;

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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("q")?.trim() ?? "";
  if (raw.length < 2) {
    return Response.json({
      properties: [] as PropertyRow[],
      contacts: [] as ContactRow[],
    });
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
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.agency_id) {
    return Response.json({ error: "Agence introuvable." }, { status: 403 });
  }

  const agencyId = profile.agency_id;
  const propSelect = "id, title, city, status";

  const [
    byTitle,
    byCity,
    byAddress,
    byFirst,
    byLast,
    byEmail,
    byPhone,
  ] = await Promise.all([
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
  ]);

  const errors = [
    byTitle.error,
    byCity.error,
    byAddress.error,
    byFirst.error,
    byLast.error,
    byEmail.error,
    byPhone.error,
  ].filter(Boolean);
  if (errors.length > 0) {
    return Response.json(
      { error: errors[0]?.message ?? "Erreur de recherche." },
      { status: 500 }
    );
  }

  function mergeUnique<T extends { id: string }>(rows: T[][]): T[] {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const group of rows) {
      for (const row of group ?? []) {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          out.push(row);
          if (out.length >= MAX_EACH) return out;
        }
      }
    }
    return out;
  }

  const properties = mergeUnique<PropertyRow>([
    (byTitle.data ?? []) as PropertyRow[],
    (byCity.data ?? []) as PropertyRow[],
    (byAddress.data ?? []) as PropertyRow[],
  ]);

  const contacts = mergeUnique<ContactRow>([
    (byFirst.data ?? []) as ContactRow[],
    (byLast.data ?? []) as ContactRow[],
    (byEmail.data ?? []) as ContactRow[],
    (byPhone.data ?? []) as ContactRow[],
  ]);

  return Response.json({ properties, contacts });
}
