import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListTodo } from "lucide-react";
import { TachesListClient } from "./taches-list-client";

export default async function TachesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Tâches</h1>
        <p className="mt-2 text-sm text-slate-500">
          Aucune agence associée à votre compte.
        </p>
      </div>
    );
  }

  const agencyId = profile.agency_id;

  const { data: taskRows, error } = await supabase
    .from("agency_tasks")
    .select("id, title, due_at, completed_at, contact_id")
    .eq("agency_id", agencyId)
    .order("due_at", { ascending: true });

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900">Tâches</h1>
        <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error.message}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Appliquez la migration{" "}
          <code className="rounded bg-white/[0.06] px-1">
            20260409300000_pipeline_tasks_consent
          </code>{" "}
          dans Supabase si la table n&apos;existe pas encore.
        </p>
      </div>
    );
  }

  const tasks = taskRows ?? [];
  const contactIds = [
    ...new Set(
      tasks.map((t) => t.contact_id).filter((x): x is string => Boolean(x))
    ),
  ];

  let nameMap: Record<string, string> = {};
  if (contactIds.length > 0) {
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, first_name, last_name")
      .eq("agency_id", agencyId)
      .in("id", contactIds);

    if (contacts) {
      nameMap = Object.fromEntries(
        contacts.map((c) => [
          c.id as string,
          `${c.first_name as string} ${c.last_name as string}`,
        ])
      );
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-700/90">
            Organisation
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-4xl font-bold tracking-tight text-slate-900">
            <ListTodo className="h-9 w-9 text-stone-600" />
            Tâches
          </h1>
          <p className="mt-2 text-slate-500">
            Rappels et actions pour votre agence.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-500 hover:text-stone-800"
        >
          ← Tableau de bord
        </Link>
      </div>

      <TachesListClient tasks={tasks} contactNames={nameMap} />
    </div>
  );
}
