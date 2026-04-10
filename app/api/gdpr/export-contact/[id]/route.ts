import { createClient } from "@/lib/supabase/server";
import { isAgentOnly, normalizeRole } from "@/lib/auth/agency-scope";

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
    .select("agency_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return new Response("Agence introuvable.", { status: 403 });
  }

  const role = normalizeRole(profile.role as string | null);
  const agentOnly = isAgentOnly(role);

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("agency_id", profile.agency_id)
    .maybeSingle();

  if (error || !contact) {
    return new Response("Contact introuvable.", { status: 404 });
  }

  if (agentOnly && (contact as { agent_id: string }).agent_id !== user.id) {
    return new Response("Accès refusé.", { status: 403 });
  }

  const [tasks, reminders, visits, attachments, followups] = await Promise.all([
    supabase
      .from("agency_tasks")
      .select("*")
      .eq("contact_id", id)
      .eq("agency_id", profile.agency_id),
    supabase
      .from("contact_send_reminders")
      .select("*")
      .eq("contact_id", id)
      .eq("agency_id", profile.agency_id),
    supabase
      .from("visit_reports")
      .select("id, visit_date, summary, recommendation, next_step")
      .eq("contact_id", id)
      .eq("agency_id", profile.agency_id),
    supabase
      .from("contact_attachments")
      .select("id, file_name, label, created_at, storage_path")
      .eq("contact_id", id)
      .eq("agency_id", profile.agency_id),
    supabase
      .from("followup_emails")
      .select("id, subject, status, created_at")
      .eq("contact_id", id)
      .eq("agency_id", profile.agency_id),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    contact,
    agency_tasks: tasks.data ?? [],
    contact_send_reminders: reminders.data ?? [],
    visit_reports: visits.data ?? [],
    contact_attachments: attachments.data ?? [],
    followup_emails: followups.data ?? [],
    notice:
      "Export à titre de portabilité / dossier interne. Vérifiez vos obligations RGPD (conservation, base légale).",
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="contact-${id.slice(0, 8)}-export.json"`,
    },
  });
}
