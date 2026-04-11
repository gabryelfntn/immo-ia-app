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
import { ContactPortalPanel } from "./contact-portal-panel";
import { ContactTagsPanel } from "./contact-tags-panel";
import { ContactAttachmentsPanel } from "./contact-attachments-panel";
import { ContactRemindersPanel } from "./contact-reminders-panel";
import { RecordRecentView } from "@/app/dashboard/_components/record-recent-view";
import { ContactQuickActions } from "./contact-quick-actions";
import { ContactCommercialPanel } from "./contact-commercial-panel";
import {
  ContactDuplicateBanner,
  type DuplicateRow,
} from "./contact-duplicate-banner";
import { buildContactTimeline } from "@/lib/activity/contact-timeline";
import { normalizeRole } from "@/lib/auth/agency-scope";
import { canDeleteContact } from "@/lib/auth/permissions";
import { ContactTimelineSection } from "./contact-timeline-section";
import { ContactCopilotPanel } from "./contact-copilot-panel";
import { ContactMessageDrafts } from "./contact-message-drafts";
import { ContactDocumentAi } from "./contact-document-ai";
import { ContactGdprPanel } from "./contact-gdpr-panel";
import { ContactPropertyLinksPanel } from "./contact-property-links-panel";

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
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200/90 px-3 py-1.5 text-xs font-semibold backdrop-blur-md ${contactStatusBadgeClass(status)}`}
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
    .select("agency_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return (
      <div>
        <p className="text-sm text-slate-500">Aucune agence associée.</p>
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
    source?: string | null;
    next_action_at?: string | null;
    next_action_label?: string | null;
    coordinates_verified_at?: string | null;
  };

  const agencyId = profile.agency_id as string;
  const emailStr = row.email as string;
  const phoneStr = row.phone as string;

  const [dupEmail, dupPhone] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, first_name, last_name")
      .eq("agency_id", agencyId)
      .eq("email", emailStr)
      .neq("id", id),
    supabase
      .from("contacts")
      .select("id, first_name, last_name")
      .eq("agency_id", agencyId)
      .eq("phone", phoneStr)
      .neq("id", id),
  ]);

  const dupMap = new Map<string, DuplicateRow>();
  for (const r of [...(dupEmail.data ?? []), ...(dupPhone.data ?? [])]) {
    dupMap.set(r.id as string, {
      id: r.id as string,
      first_name: r.first_name as string,
      last_name: r.last_name as string,
    });
  }
  const duplicates = [...dupMap.values()];

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

  const [tagListRes, linkRes] = await Promise.all([
    supabase
      .from("contact_tags")
      .select("id, slug, label, color")
      .eq("agency_id", profile.agency_id)
      .order("label", { ascending: true }),
    supabase
      .from("contact_tag_links")
      .select("tag_id")
      .eq("contact_id", id),
  ]);

  const agencyTags = tagListRes.error || !tagListRes.data ? [] : tagListRes.data;
  const initialTagIds = (linkRes.data ?? []).map((l) => l.tag_id as string);

  const { data: attachmentRows } = await supabase
    .from("contact_attachments")
    .select("id, storage_path, file_name, label")
    .eq("contact_id", id)
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });

  const attachments =
    attachmentRows?.map((a) => ({
      id: a.id as string,
      storage_path: a.storage_path as string,
      file_name: a.file_name as string,
      label: (a.label as string | null) ?? null,
    })) ?? [];

  const { data: reminderRows } = await supabase
    .from("contact_send_reminders")
    .select("id, remind_at, note")
    .eq("contact_id", id)
    .eq("agency_id", agencyId)
    .is("completed_at", null)
    .order("remind_at", { ascending: true });

  const reminders =
    reminderRows?.map((r) => ({
      id: r.id as string,
      remind_at: r.remind_at as string,
      note: (r.note as string | null) ?? null,
    })) ?? [];

  const timelineItems = await buildContactTimeline(
    supabase,
    id,
    agencyId
  );

  const [{ data: propertyLinkRows }, { data: propertyPickList }] =
    await Promise.all([
      supabase
        .from("contact_property_links")
        .select(
          `
          id,
          link_type,
          note,
          property_id,
          properties ( title, city )
        `
        )
        .eq("contact_id", id)
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("properties")
        .select("id, title, city")
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false })
        .limit(120),
    ]);

  const propertyLinks =
    propertyLinkRows?.map((row) => {
      const raw = row.properties;
      const p = Array.isArray(raw) ? raw[0] : raw;
      return {
        id: row.id as string,
        link_type: row.link_type as string,
        note: (row.note as string | null) ?? null,
        property_id: row.property_id as string,
        properties: p
          ? {
              title: String((p as { title?: string }).title ?? ""),
              city:
                (p as { city?: string | null }).city != null
                  ? String((p as { city?: string | null }).city)
                  : null,
            }
          : null,
      };
    }) ?? [];

  const propertyOptions =
    propertyPickList?.map((p) => ({
      id: p.id as string,
      title: p.title as string,
      city: (p.city as string | null) ?? null,
    })) ?? [];

  const userRole = normalizeRole(profile?.role as string | null);
  const contactAgentId = row.agent_id as string;
  const allowDelete = canDeleteContact(userRole, user.id, contactAgentId);

  const desiredCity =
    typeof row.desired_city === "string" ? row.desired_city.trim() : "";

  return (
    <div className="mx-auto max-w-3xl">
      <RecordRecentView
        kind="contact"
        id={id}
        title={fullName}
        href={`/dashboard/contacts/${id}`}
      />
      <Link
        href="/dashboard/contacts"
        className="text-sm font-medium text-slate-500 transition-all duration-300 hover:text-stone-800"
      >
        ← Retour aux contacts
      </Link>

      <div className="mt-6">
        <ContactDuplicateBanner duplicates={duplicates} />
      </div>

      <div className="mt-8 flex flex-col gap-6 rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury sm:flex-row sm:items-start sm:justify-between">
        <div>
          <PulsingContactBadge status={status} />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            {fullName}
          </h1>
          <p className="mt-3 text-sm text-slate-500">{row.email as string}</p>
          <p className="mt-1 text-sm text-slate-500">{row.phone as string}</p>
          {ext.next_action_label || ext.next_action_at ? (
            <p className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
              <span className="font-semibold">Prochaine action : </span>
              {ext.next_action_label || "—"}
              {ext.next_action_at
                ? ` · ${formatDateTimeFr(ext.next_action_at)}`
                : null}
            </p>
          ) : null}
          <div className="mt-4">
            <ContactQuickActions
              email={emailStr}
              phone={phoneStr}
              mapsQuery={desiredCity || null}
            />
          </div>
          <p className="mt-3 text-sm">
            <a
              href={`/api/reports/contact/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-stone-700 underline-offset-2 hover:underline"
            >
              Exporter la fiche PDF
            </a>
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-4 sm:items-end">
          <div className="rounded-xl border border-stone-500/20 bg-stone-700/10 px-5 py-4 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
              Score priorité
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-stone-900">
              {leadScore}
            </p>
            <p className="mt-1 max-w-[12rem] text-[11px] text-stone-600">
              Chaleur, étape pipeline, données et récence.
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/90 p-4">
            <UpdateContactStatusControl contactId={id} currentStatus={status} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <dl className="rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
          <dt className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
            Source
          </dt>
          <dd className="mt-2 font-medium text-slate-900">
            {ext.source?.trim() ? ext.source.trim() : "—"}
          </dd>
          <dt className="mt-6 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
            Type
          </dt>
          <dd className="mt-2 font-medium text-slate-900">
            {CONTACT_TYPE_LABELS[ctype]}
          </dd>
          <dt className="mt-6 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
            Statut
          </dt>
          <dd className="mt-2 font-medium text-slate-900">
            {CONTACT_STATUS_LABELS[status]}
          </dd>
        </dl>
        <dl className="rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
          <dt className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
            Budget
          </dt>
          <dd className="mt-2 font-medium text-slate-900">
            {budgetLabel ?? "—"}
          </dd>
          <dt className="mt-6 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
            Ville recherchée
          </dt>
          <dd className="mt-2 font-medium text-slate-900">
            {typeof row.desired_city === "string" && row.desired_city.trim()
              ? row.desired_city
              : "—"}
          </dd>
        </dl>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
          <UpdatePipelineStageControl
            contactId={id}
            currentStage={pipelineStage}
          />
        </div>
      </div>

      <dl className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
        <dt className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
          Dernière relance email envoyée
        </dt>
        <dd className="mt-2 font-medium text-slate-900">
          {formatDateTimeFr(ext.last_followup_sent_at)}
        </dd>
        <dt className="mt-6 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
          Dernier contact enregistré (CRM)
        </dt>
        <dd className="mt-2 font-medium text-slate-900">
          {formatDateTimeFr(ext.last_contacted_at)}
        </dd>
      </dl>

      <section className="mt-8">
        <ContactCommercialPanel
          contactId={id}
          initialSource={ext.source ?? null}
          initialNextLabel={ext.next_action_label ?? null}
          initialNextAt={ext.next_action_at ?? null}
          initialVerifiedAt={ext.coordinates_verified_at ?? null}
        />
      </section>

      <section className="mt-8">
        <ContactPropertyLinksPanel
          contactId={id}
          initialLinks={propertyLinks}
          propertyOptions={propertyOptions}
        />
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-800">
          Chronologie
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Visites, relances email, tâches et rappels liés à ce contact.
        </p>
        <div className="mt-4">
          <ContactTimelineSection items={timelineItems} />
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-800">
          Assistant IA (fiche contact)
        </h2>
        <div className="mt-4 space-y-8">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Copilote
            </h3>
            <p className="text-xs text-slate-500">
              Synthèse et pistes d’actions (Claude).
            </p>
            <div className="mt-2">
              <ContactCopilotPanel contactId={id} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Brouillons message
            </h3>
            <div className="mt-2">
              <ContactMessageDrafts contactId={id} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Texte document → champs CRM
            </h3>
            <div className="mt-2">
              <ContactDocumentAi contactId={id} />
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <FollowupOptOutToggle contactId={id} initialOptOut={followupOptOut} />
        <ProspectingConsentToggle
          contactId={id}
          initialConsent={prospectingConsent}
        />
      </div>

      <section className="mt-8">
        <ContactAttachmentsPanel
          contactId={id}
          agencyId={agencyId}
          attachments={attachments}
        />
      </section>

      <section className="mt-8">
        <ContactRemindersPanel contactId={id} reminders={reminders} />
      </section>

      <section className="mt-8">
        <ContactTasksPanel contactId={id} tasks={contactTasks} />
      </section>

      <section className="mt-8">
        <ContactPortalPanel contactId={id} />
      </section>

      <section className="mt-8">
        <ContactTagsPanel
          contactId={id}
          agencyTags={agencyTags}
          initialTagIds={initialTagIds}
        />
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 card-luxury">
        <ContactMatching contactId={id} />
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
        <ContactNotesForm contactId={id} initialNotes={notesText} />
      </section>

      <section className="mt-8">
        <ContactGdprPanel contactId={id} canDelete={allowDelete} />
      </section>
    </div>
  );
}
