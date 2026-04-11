import { createClient } from "@/lib/supabase/server";
import { buildTextPdf } from "@/lib/pdf/simple-pdf";

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Non authentifié.", { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return new Response("Agence introuvable.", { status: 403 });
  }

  const { data: row, error } = await supabase
    .from("visit_reports")
    .select(
      `
      visit_date,
      summary,
      recommendation,
      next_step,
      client_interest,
      properties ( title, city, address ),
      contacts ( first_name, last_name )
    `
    )
    .eq("id", id)
    .eq("agency_id", profile.agency_id)
    .maybeSingle();

  if (error || !row) {
    return new Response("Compte rendu introuvable.", { status: 404 });
  }

  const p = row.properties as
    | { title?: string; city?: string; address?: string }
    | { title?: string; city?: string; address?: string }[]
    | null;
  const prop = Array.isArray(p) ? p[0] : p;
  const c = row.contacts as
    | { first_name?: string; last_name?: string }
    | { first_name?: string; last_name?: string }[]
    | null;
  const contact = Array.isArray(c) ? c[0] : c;

  const lines = [
    `Date de visite : ${String(row.visit_date)}`,
    `Bien : ${prop?.title ?? "—"} — ${prop?.city ?? ""}`,
    `Client : ${contact?.first_name ?? ""} ${contact?.last_name ?? ""}`.trim(),
    `Intérêt client : ${String(row.client_interest ?? "")}`,
    "",
    "Résumé :",
    String(row.summary ?? ""),
    "",
    "Recommandation :",
    String(row.recommendation ?? ""),
    "",
    "Prochaine étape :",
    String(row.next_step ?? ""),
  ];

  const pdf = await buildTextPdf(lines, "Compte rendu de visite — ImmoAI");
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="visite-${id.slice(0, 8)}.pdf"`,
    },
  });
}
