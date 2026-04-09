import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CONTACT_STATUS_LABELS,
  CONTACT_TYPE_LABELS,
  contactStatusBadgeClass,
} from "@/lib/contacts/labels";
import { computeLeadScore } from "@/lib/dashboard/lead-score";
import { parsePipelineStage } from "@/lib/contacts/pipeline";
import type { ContactStatus, ContactType, PipelineStage } from "@/lib/contacts/schema";
import { FollowupOptOutToggle } from "./followup-opt-out-toggle";
import { ContactMatching } from "./matching";
import { ContactNotesForm } from "./contact-notes-form";
import { ContactTasksPanel } from "./contact-tasks";
import { ProspectingConsentToggle } from "./prospecting-consent-toggle";
import { UpdateContactStatusControl } from "./update-contact-status";
import { UpdatePipelineStageControl } from "./update-pipeline-stage";

type Props = { params: Promise<{ id: string }> };

function formatDateTimeFr(iso: string | null | undefined): string {
  if (!iso || typeof iso !== "string") return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function formatBudgetRange(
  min: number | null,
  max: number | null
): string | null {
  if (min == null && max == null) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(n);
  if (min != null && max != null) return `${fmt(min)} — ${fmt(max)}`;
  if (min != null) return `À partir de ${fmt(min)}`;
  return `Jusqu’à ${fmt(max!)}`;
}

function PulsingContactBadge({ status }: { status: ContactStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-3 py-1.5 text-xs font-semibold backdrop-blur-md ${contactStatusBadgeClass(status)}`}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-current animate-pulse"
        aria-hidden
      />
      {CONTACT_STATUS_LABELS[status]}
    </span>
  );
}

export default async function ContactDetailPage({ params }: Props) {
  const { id } = await params;

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
        <p className="text-sm text-zinc-500">Aucune agence associée.</p>
      </div>
    );
  }

  const { data: row, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("agency_id", profile.agency_id)
    .maybeSingle();

  if (error || !row) {
    notFound();
  }

  const status = row.status as ContactStatus;
  const ctype = row.type as ContactType;
  const fullName = `${row.first_name as string} ${row.last_name as string}`;
  const budgetLabel = formatBudgetRange(
    row.budget_min != null ? Number(row.budget_min) : null,
    row.budget_max != null ? Number(row.budget_max) : null
  );
  const notesText =
    typeof row.notes === "string" && row.notes ? row.notes : "";
  const followupOptOut = Boolean(
    (row as { followup_opt_out?: boolean }).followup_opt_out
  );
  const ext = row as {
    last_contacted_at?: string | null;
    last_followup_sent_at?: string | null;
    pipeline_stage?: string | null;
    prospecting_consent?: boolean | null;
  };

  const pipelineStage = parsePipelineStage(ext.pipeline_stage) as PipelineStage;
  const prospectingConsent =
    ext.prospecting_consent === null || ext.prospecting_consent === undefined
      ? true
      : Boolean(ext.prospecting_consent);

  const leadScore = computeLeadScore({
    status,
    pipeline_stage: pipelineStage,
    budget_min: row.budget_min != null ? Number(row.budget_min) : null,
    budget_max: row.budget_max != null ? Number(row.budget_max) : null,
    desired_city:
      typeof row.desired_city === "string" ? row.desired_city : null,
    last_contacted_at: ext.last_contacted_at ?? null,
    created_at: row.created_at as string,
  });

  const taskRes = await supabase
    .from("agency_tasks")
    .select("id, title, due_at, completed_at, notes")
    .eq("contact_id", id)
    .eq("agency_id", profile.agency_id)
    .order("due_at", { ascending: true });

  const contactTasks = taskRes.error || !taskRes.data ? [] : taskRes.data;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/contacts"
        className="text-sm font-medium text-zinc-400 transition-all duration-300 hover:text-violet-300"
      >
        ← Retour aux contacts
      </Link>

      <div className="mt-8 flex flex-col gap-6 rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 card-luxury sm:flex-row sm:items-start sm:justify-between">
        <div>
          <PulsingContactBadge status={status} />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-50">
            {fullName}
          </h1>
          <p className="mt-3 text-sm text-zinc-400">{row.email as string}</p>
          <p className="mt-1 text-sm text-zinc-400">{row.phone as string}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-4 sm:items-end">
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-5 py-4 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300/80">
              Score priorité
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-violet-100">
              {leadScore}
            </p>
            <p className="mt-1 max-w-[12rem] text-[11px] text-violet-200/70">
              Chaleur, étape pipeline, données et récence.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#0c0c10]/90 p-4">
            <UpdateContactStatusControl contactId={id} currentStatus={status} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <dl className="rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 card-luxury">
          <dt className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            Type
          </dt>
          <dd className="mt-2 font-medium text-zinc-50">
            {CONTACT_TYPE_LABELS[ctype]}
          </dd>
          <dt className="mt-6 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            Statut
          </dt>
          <dd className="mt-2 font-medium text-zinc-50">
            {CONTACT_STATUS_LABELS[status]}
          </dd>
        </dl>
        <dl className="rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 card-luxury">
          <dt className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            Budget
          </dt>
          <dd className="mt-2 font-medium text-zinc-50">
            {budgetLabel ?? "—"}
          </dd>
          <dt className="mt-6 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            Ville recherchée
          </dt>
          <dd className="mt-2 font-medium text-zinc-50">
            {typeof row.desired_city === "string" && row.desired_city.trim()
              ? row.desired_city
              : "—"}
          </dd>
        </dl>
        <div className="rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 card-luxury">
          <UpdatePipelineStageControl
            contactId={id}
            currentStage={pipelineStage}
          />
        </div>
      </div>

      <dl className="mt-6 rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 card-luxury">
        <dt className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
          Dernière relance email envoyée
        </dt>
        <dd className="mt-2 font-medium text-zinc-50">
          {formatDateTimeFr(ext.last_followup_sent_at)}
        </dd>
        <dt className="mt-6 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
          Dernier contact enregistré (CRM)
        </dt>
        <dd className="mt-2 font-medium text-zinc-50">
          {formatDateTimeFr(ext.last_contacted_at)}
        </dd>
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <FollowupOptOutToggle contactId={id} initialOptOut={followupOptOut} />
        <ProspectingConsentToggle
          contactId={id}
          initialConsent={prospectingConsent}
        />
      </div>

      <section className="mt-8">
        <ContactTasksPanel contactId={id} tasks={contactTasks} />
      </section>

      <section className="mt-8 rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 sm:p-8 card-luxury">
        <ContactMatching contactId={id} />
      </section>

      <section className="mt-6 rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 card-luxury">
        <ContactNotesForm contactId={id} initialNotes={notesText} />
      </section>
    </div>
  );
}
