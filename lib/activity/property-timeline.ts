import type { SupabaseClient } from "@supabase/supabase-js";

export type PropertyTimelineItem = {
  id: string;
  at: string;
  kind: string;
  title: string;
  subtitle?: string;
  href?: string;
};

export async function buildPropertyTimeline(
  supabase: SupabaseClient,
  propertyId: string,
  agencyId: string
): Promise<PropertyTimelineItem[]> {
  const items: PropertyTimelineItem[] = [];

  const { data: prop } = await supabase
    .from("properties")
    .select("created_at, title")
    .eq("id", propertyId)
    .eq("agency_id", agencyId)
    .maybeSingle();

  if (prop?.created_at) {
    items.push({
      id: `p-created-${propertyId}`,
      at: prop.created_at as string,
      kind: "bien",
      title: "Bien créé",
      subtitle: prop.title as string,
    });
  }

  const [visits, tasks, prices] = await Promise.all([
    supabase
      .from("visit_reports")
      .select("id, visit_date, summary")
      .eq("property_id", propertyId)
      .eq("agency_id", agencyId)
      .order("visit_date", { ascending: false })
      .limit(30),
    supabase
      .from("agency_tasks")
      .select("id, title, due_at, completed_at")
      .eq("property_id", propertyId)
      .eq("agency_id", agencyId)
      .order("due_at", { ascending: false })
      .limit(30),
    supabase
      .from("property_price_history")
      .select("id, price, recorded_at")
      .eq("property_id", propertyId)
      .eq("agency_id", agencyId)
      .order("recorded_at", { ascending: false })
      .limit(20),
  ]);

  for (const v of visits.data ?? []) {
    const sum = String(v.summary ?? "").trim();
    items.push({
      id: `visit-${v.id}`,
      at: (v.visit_date as string) || new Date().toISOString(),
      kind: "visite",
      title: "Visite",
      subtitle: sum.length > 100 ? `${sum.slice(0, 97)}…` : sum || undefined,
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

  for (const h of prices.data ?? []) {
    items.push({
      id: `price-${h.id}`,
      at: h.recorded_at as string,
      kind: "prix",
      title: `Prix enregistré : ${Number(h.price).toLocaleString("fr-FR")} €`,
      href: `/dashboard/biens/${propertyId}`,
    });
  }

  items.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );

  return items.slice(0, 60);
}
