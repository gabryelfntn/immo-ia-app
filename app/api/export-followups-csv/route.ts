import { createClient } from "@/lib/supabase/server";

function csvCell(v: string | null | undefined): string {
  const s = v == null ? "" : String(v);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response("Non authentifié.", { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.agency_id) {
    return new Response("Agence introuvable.", { status: 403 });
  }

  const agencyId = profile.agency_id as string;

  const { data: rows, error } = await supabase
    .from("followup_emails")
    .select(
      `
      created_at,
      status,
      subject,
      tone,
      error,
      body,
      contact_id,
      contacts ( first_name, last_name, email )
    `
    )
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const header = [
    "created_at",
    "status",
    "subject",
    "tone",
    "contact_first_name",
    "contact_last_name",
    "contact_email",
    "error",
    "body",
  ];

  const lines = [header.join(",")];

  for (const r of rows ?? []) {
    const c = r.contacts as {
      first_name?: string;
      last_name?: string;
      email?: string;
    } | null;
    lines.push(
      [
        csvCell(r.created_at as string),
        csvCell(r.status as string),
        csvCell(r.subject as string),
        csvCell((r.tone as string | null) ?? ""),
        csvCell(c?.first_name ?? ""),
        csvCell(c?.last_name ?? ""),
        csvCell(c?.email ?? ""),
        csvCell((r.error as string | null) ?? ""),
        csvCell((r.body as string) ?? ""),
      ].join(",")
    );
  }

  const csv = "\uFEFF" + lines.join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `relances-${stamp}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
