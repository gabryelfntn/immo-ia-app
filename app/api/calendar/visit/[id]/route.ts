import { createClient } from "@/lib/supabase/server";
import { buildVisitReportIcs } from "@/lib/calendar/visit-ics";

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
      id,
      visit_date,
      summary,
      property_id,
      contact_id,
      properties ( title, city ),
      contacts ( first_name, last_name )
    `
    )
    .eq("id", id)
    .eq("agency_id", profile.agency_id)
    .maybeSingle();

  if (error || !row) {
    return new Response("Visite introuvable.", { status: 404 });
  }

  type PropRow = { title: string; city: string };
  type ContactRow = { first_name: string; last_name: string };

  const r = row as {
    id: string;
    visit_date: string;
    summary: string;
    properties: PropRow | PropRow[] | null;
    contacts: ContactRow | ContactRow[] | null;
  };

  const property = Array.isArray(r.properties)
    ? r.properties[0] ?? null
    : r.properties;
  const contact = Array.isArray(r.contacts) ? r.contacts[0] ?? null : r.contacts;

  const ics = buildVisitReportIcs({
    id: r.id,
    visitDate: r.visit_date,
    summary: r.summary,
    propertyTitle: property?.title ?? "Bien",
    propertyCity: property?.city ?? "",
    contactName: contact
      ? `${contact.first_name} ${contact.last_name}`
      : "Client",
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="visite-${id.slice(0, 8)}.ics"`,
    },
  });
}
