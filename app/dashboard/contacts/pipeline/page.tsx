import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parsePipelineStage } from "@/lib/contacts/pipeline";
import type { PipelineStage } from "@/lib/contacts/schema";
import { PIPELINE_STAGES } from "@/lib/contacts/schema";
import { isAgentOnly, normalizeRole } from "@/lib/auth/agency-scope";
import { CONTACT_STATUS_LABELS } from "@/lib/contacts/labels";
import type { ContactStatus } from "@/lib/contacts/schema";
import { PipelineKanban } from "./pipeline-kanban";

export default async function ContactsPipelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return (
      <p className="text-sm text-slate-500">Aucune agence associée.</p>
    );
  }

  let q = supabase
    .from("contacts")
    .select("id, first_name, last_name, status, pipeline_stage")
    .eq("agency_id", profile.agency_id);

  const role = normalizeRole(profile.role as string | null);
  if (isAgentOnly(role)) {
    q = q.eq("agent_id", user.id);
  }

  const { data: rows, error } = await q;

  if (error) {
    return (
      <p className="text-sm text-red-600">{error.message}</p>
    );
  }

  const columns: Record<
    PipelineStage,
    { id: string; name: string; status: string }[]
  > = {
    premier_contact: [],
    qualifie: [],
    visite: [],
    offre: [],
    signature: [],
    fidelisation: [],
  };

  for (const r of rows ?? []) {
    const stage = parsePipelineStage(
      (r as { pipeline_stage?: string | null }).pipeline_stage
    );
    const status = r.status as ContactStatus;
    columns[stage].push({
      id: r.id as string,
      name: `${r.first_name} ${r.last_name}`,
      status: CONTACT_STATUS_LABELS[status],
    });
  }

  const total = Object.values(columns).reduce((a, b) => a + b.length, 0);

  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600/90">
            CRM
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Pipeline (Kanban)
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {total} contact{total !== 1 ? "s" : ""} — glissez une carte pour
            changer l&apos;étape.
          </p>
        </div>
        <Link
          href="/dashboard/contacts"
          className="text-sm font-medium text-slate-600 hover:text-stone-900"
        >
          ← Liste contacts
        </Link>
      </div>

      <div className="mt-10">
        <PipelineKanban columns={columns} />
      </div>

      <p className="mt-8 text-xs text-slate-500">
        Étapes : {PIPELINE_STAGES.join(" · ")}
      </p>
    </div>
  );
}
