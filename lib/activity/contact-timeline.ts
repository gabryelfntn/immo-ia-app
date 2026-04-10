import type { SupabaseClient } from "@supabase/supabase-js";

export type ContactTimelineItem = {
  id: string;
  at: string;
  kind: string;
  title: string;
  subtitle?: string;
  href?: string;
};

export async function buildContactTimeline(
  supabase: SupabaseClient,
  contactId: string,
  agencyId: string
): Promise<ContactTimelineItem[]> {
  const items: ContactTimelineItem[] = [];

  const { data: contact } = await supabase
    .from("contacts")
    .select("created_at, first_name, last_name")
    .eq("id", contactId)
    .eq("agency_id", agencyId)
    .maybeSingle();

  if (contact?.created_at) {
    items.push({
      id: `c-created-${contactId}`,
      at: contact.created_at as string,
      kind: "contact",
      title: "Contact créé",
      subtitle: `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim(),
    });
  }

  const [visits, tasks, reminders, followups] = await Promise.all([
    supabase
      .from("visit_reports")
      .select("id, visit_date, summary")
      .eq("contact_id", contactId)
      .eq("agency_id", agencyId)
      .order("visit_date", { ascending: false })
      .limit(40),
    supabase
      .from("agency_tasks")
      .select("id, title, due_at, completed_at")
      .eq("contact_id", contactId)
      .eq("agency_id", agencyId)
      .order("due_at", { ascending: false })
      .limit(40),
    supabase
      .from("contact_send_reminders")
      .select("id, remind_at, note, completed_at")
      .eq("contact_id", contactId)
      .eq("agency_id", agencyId)
      .order("remind_at", { ascending: false })
      .limit(40),
    supabase
      .from("followup_emails")
      .select("id, created_at, subject, status")
      .eq("contact_id", contactId)
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  for (const v of visits.data ?? []) {
    const sum = String(v.summary ?? "").trim();
    items.push({
      id: `visit-${v.id}`,
      at: (v.visit_date as string) || new Date().toISOString(),
      kind: "visite",
      title: "Compte rendu de visite",
      subtitle: sum.length > 120 ? `${sum.slice(0, 117)}…` : sum || undefined,
      href: `/dashboard/visites`,
    });
  }

  for (const t of tasks.data ?? []) {
    const done = t.completed_at ? " (terminée)" : "";
    items.push({
      id: `task-${t.id}`,
      at: (t.due_at as string) || new Date().toISOString(),
      kind: "tache",
      title: `Tâche${done}`,
      subtitle: t.title as string,
      href: `/dashboard/taches`,
    });
  }

  for (const r of reminders.data ?? []) {
    const done = r.completed_at ? " (traité)" : "";
    items.push({
      id: `rem-${r.id}`,
      at: r.remind_at as string,
      kind: "rappel",
      title: `Rappel d’envoi${done}`,
      subtitle: (r.note as string | null)?.trim() || undefined,
    });
  }

  for (const f of followups.data ?? []) {
    items.push({
      id: `fu-${f.id}`,
      at: (f.created_at as string) || new Date().toISOString(),
      kind: "relance",
      title: `Email relance — ${String(f.subject ?? "").slice(0, 60)}`,
      subtitle: `Statut : ${String(f.status ?? "")}`,
      href: `/dashboard/relances/historique`,
    });
  }

  items.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );

  return items.slice(0, 80);
}
