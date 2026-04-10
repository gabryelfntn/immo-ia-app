import { createClient } from "@/lib/supabase/server";
import { isAgentOnly, normalizeRole } from "@/lib/auth/agency-scope";

function csvCell(v: string): string {
  if (/[;\n"]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Non authentifié.", { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return new Response("Agence introuvable.", { status: 403 });
  }

  let q = supabase
    .from("properties")
    .select(
      "id, title, type, transaction, status, price, surface, rooms, bedrooms, address, city, zip_code, listing_url, created_at, updated_at"
    )
    .eq("agency_id", profile.agency_id)
    .order("created_at", { ascending: false });

  const userRole = normalizeRole(profile.role as string | null);
  if (isAgentOnly(userRole)) {
    q = q.eq("agent_id", user.id);
  }

  const { data, error } = await q;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const cols = [
    "id",
    "title",
    "type",
    "transaction",
    "status",
    "price",
    "surface",
    "rooms",
    "bedrooms",
    "address",
    "city",
    "zip_code",
    "listing_url",
    "created_at",
    "updated_at",
  ] as const;

  const lines = [cols.join(";")];
  for (const row of data ?? []) {
    const r = row as Record<string, unknown>;
    lines.push(
      cols.map((c) => csvCell(r[c] != null ? String(r[c]) : "")).join(";")
    );
  }

  const body = "\uFEFF" + lines.join("\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="biens-export.csv"',
    },
  });
}
