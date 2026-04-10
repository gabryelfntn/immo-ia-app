import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BellOff, Mail, MapPin, Phone, Plus } from "lucide-react";
import { computeLeadScore } from "@/lib/dashboard/lead-score";
import {
  parsePipelineStage,
  pipelineStageBadgeClass,
  PIPELINE_STAGE_LABELS,
} from "@/lib/contacts/pipeline";
import {
  CONTACT_STATUSES,
  CONTACT_TYPES,
  PIPELINE_STAGES,
  contactStatusEnum,
  contactTypeEnum,
  pipelineStageEnum,
} from "@/lib/contacts/schema";
import {
  CONTACT_STATUS_LABELS,
  CONTACT_TYPE_LABELS,
  contactStatusBadgeClass,
} from "@/lib/contacts/labels";
import type {
  ContactStatus,
  ContactType,
  PipelineStage,
} from "@/lib/contacts/schema";
import { normalizeRole, isAgentOnly } from "@/lib/auth/agency-scope";

type Search = { status?: string; type?: string; pipeline?: string; tag?: string };

function parseStatusFilter(raw: string | undefined): ContactStatus | undefined {
  if (!raw) return undefined;
  const r = contactStatusEnum.safeParse(raw);
  return r.success ? r.data : undefined;
}

function parseTypeFilter(raw: string | undefined): ContactType | undefined {
  if (!raw) return undefined;
  const r = contactTypeEnum.safeParse(raw);
  return r.success ? r.data : undefined;
}

function parsePipelineFilter(
  raw: string | undefined
): PipelineStage | undefined {
  if (!raw) return undefined;
  const r = pipelineStageEnum.safeParse(raw);
  return r.success ? r.data : undefined;
}

type Props = { searchParams?: Promise<Search> };

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

function initials(first: string, last: string): string {
  const a = first.trim()[0] ?? "";
  const b = last.trim()[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

function avatarGradient(status: ContactStatus): string {
  switch (status) {
    case "froid":
      return "from-zinc-500 to-zinc-700 ring-zinc-400/40";
    case "tiede":
      return "from-orange-500 to-amber-600 ring-orange-400/40";
    case "chaud":
      return "from-red-500 to-rose-600 ring-red-400/40";
    case "client":
      return "from-emerald-500 to-teal-600 ring-emerald-400/40";
    default:
      return "from-zinc-500 to-zinc-700 ring-zinc-400/40";
  }
}

function PulsingContactBadge({ status }: { status: ContactStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200/90 px-3 py-1 text-xs font-semibold backdrop-blur-md ${contactStatusBadgeClass(status)}`}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-current animate-pulse"
        aria-hidden
      />
      {CONTACT_STATUS_LABELS[status]}
    </span>
  );
}

export default async function ContactsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const statusFilter = parseStatusFilter(sp.status);
  const typeFilter = parseTypeFilter(sp.type);
  const pipelineFilter = parsePipelineFilter(sp.pipeline);
  const tagSlug = sp.tag?.trim() || "";

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
        <h1 className="text-3xl font-bold text-slate-900">Contacts</h1>
        <p className="mt-2 text-sm text-slate-500">
          Aucune agence associée à votre compte.
        </p>
      </div>
    );
  }

  const { data: tagRows, error: tagListErr } = await supabase
    .from("contact_tags")
    .select("id, slug, label")
    .eq("agency_id", profile.agency_id)
    .order("label", { ascending: true });

  const tagsForFilter = tagListErr ? [] : (tagRows ?? []);

  let tagContactIds: string[] | null = null;
  if (tagSlug) {
    const tagId = tagsForFilter.find((t) => t.slug === tagSlug)?.id as
      | string
      | undefined;
    if (!tagId) {
      tagContactIds = [];
    } else {
      const { data: links } = await supabase
        .from("contact_tag_links")
        .select("contact_id")
        .eq("tag_id", tagId);
      tagContactIds = (links ?? []).map((l) => l.contact_id as string);
    }
  }

  let query = supabase
    .from("contacts")
    .select("*")
    .eq("agency_id", profile.agency_id)
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }
  if (typeFilter) {
    query = query.eq("type", typeFilter);
  }
  if (pipelineFilter) {
    query = query.eq("pipeline_stage", pipelineFilter);
  }

  const userRole = normalizeRole(profile.role as string | null);
  if (isAgentOnly(userRole)) {
    query = query.eq("agent_id", user.id);
  }

  if (tagContactIds !== null && tagContactIds.length > 0) {
    query = query.in("id", tagContactIds);
  }

  const skipQuery = tagSlug && tagContactIds !== null && tagContactIds.length === 0;

  const { data: contacts, error } = skipQuery
    ? { data: [], error: null as null }
    : await query;

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Contacts</h1>
        <p className="mt-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error.message}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Vérifiez que la table{" "}
          <code className="rounded bg-white/[0.06] px-1">contacts</code> existe dans
          Supabase (migration{" "}
          <code className="rounded bg-white/[0.06] px-1">20260409210000_contacts</code>
          ).
        </p>
      </div>
    );
  }

  const list = contacts ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500/90">
            CRM
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
            Contacts
          </h1>
          <p className="mt-2 text-slate-500">
            {list.length} contact{list.length !== 1 ? "s" : ""} pour votre agence
          </p>
        </div>
        <Link
          href="/dashboard/contacts/new"
          className="btn-luxury-primary inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all duration-300"
        >
          <Plus className="relative z-10 h-5 w-5" strokeWidth={2.5} />
          <span className="relative z-10">Ajouter un contact</span>
        </Link>
      </div>

      <form
        action="/dashboard/contacts"
        method="get"
        className="mt-10 flex flex-wrap items-center gap-3"
      >
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/90 bg-white/[0.03] p-2 backdrop-blur-sm">
          <select
            id="filter-contact-status"
            name="status"
            defaultValue={statusFilter ?? ""}
            className="rounded-full border border-slate-200/90 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 outline-none transition-all duration-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-500/20"
          >
            <option value="">Tous les statuts</option>
            {CONTACT_STATUSES.map((s) => (
              <option key={s} value={s} className="bg-white">
                {CONTACT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            id="filter-contact-type"
            name="type"
            defaultValue={typeFilter ?? ""}
            className="rounded-full border border-slate-200/90 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 outline-none transition-all duration-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-500/20"
          >
            <option value="">Tous les types</option>
            {CONTACT_TYPES.map((t) => (
              <option key={t} value={t} className="bg-white">
                {CONTACT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <select
            id="filter-pipeline"
            name="pipeline"
            defaultValue={pipelineFilter ?? ""}
            className="rounded-full border border-slate-200/90 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 outline-none transition-all duration-300 focus:border-stone-500/40 focus:ring-2 focus:ring-stone-500/20"
          >
            <option value="">Toutes les étapes</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s} className="bg-white">
                {PIPELINE_STAGE_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            id="filter-tag"
            name="tag"
            defaultValue={tagSlug}
            className="max-w-[200px] rounded-full border border-slate-200/90 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 outline-none transition-all duration-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-500/20"
          >
            <option value="">Tous les tags</option>
            {tagsForFilter.map((t) => (
              <option
                key={t.id as string}
                value={t.slug as string}
                className="bg-white"
              >
                {t.label as string}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full bg-amber-500/15 px-5 py-2 text-sm font-semibold text-amber-800 transition-all duration-300 hover:bg-amber-500/25"
          >
            Appliquer
          </button>
        </div>
        {(statusFilter || typeFilter || pipelineFilter || tagSlug) && (
          <Link
            href="/dashboard/contacts"
            className="text-sm font-medium text-slate-500 transition-all duration-300 hover:text-amber-400"
          >
            Réinitialiser
          </Link>
        )}
      </form>

      {list.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-white/[0.03] px-8 py-20 text-center">
          <p className="text-xl font-semibold text-slate-700">
            Aucun contact pour l&apos;instant
          </p>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            {statusFilter || typeFilter || pipelineFilter || tagSlug
              ? "Aucun contact ne correspond aux filtres."
              : "Ajoutez votre premier contact pour suivre prospects et mandants."}
          </p>
          <Link
            href="/dashboard/contacts/new"
            className="btn-luxury-primary mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
          >
            <Plus className="relative z-10 h-5 w-5" />
            <span className="relative z-10">Ajouter un contact</span>
          </Link>
        </div>
      ) : (
        <ul className="mt-10 flex flex-col gap-4">
          {list.map((c) => {
            const status = c.status as ContactStatus;
            const ctype = c.type as ContactType;
            const fn = c.first_name as string;
            const ln = c.last_name as string;
            const fullName = `${fn} ${ln}`;
            const ext = c as {
              pipeline_stage?: string | null;
              last_contacted_at?: string | null;
            };
            const pipelineStage = parsePipelineStage(ext.pipeline_stage);
            const leadScore = computeLeadScore({
              status,
              pipeline_stage: pipelineStage,
              budget_min: c.budget_min != null ? Number(c.budget_min) : null,
              budget_max: c.budget_max != null ? Number(c.budget_max) : null,
              desired_city:
                typeof c.desired_city === "string" ? c.desired_city : null,
              last_contacted_at: ext.last_contacted_at ?? null,
              created_at: c.created_at as string,
            });
            const budgetLabel = formatBudgetRange(
              c.budget_min != null ? Number(c.budget_min) : null,
              c.budget_max != null ? Number(c.budget_max) : null
            );
            return (
              <li key={c.id as string}>
                <Link
                  href={`/dashboard/contacts/${c.id}`}
                  className="card-luxury group flex flex-col gap-5 rounded-2xl border border-slate-200/90 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-stone-400/25 sm:flex-row sm:items-center sm:gap-6"
                >
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-lg font-bold text-slate-900 ring-2 ${avatarGradient(status)}`}
                  >
                    {initials(fn, ln)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-bold text-slate-900 transition-colors duration-300 group-hover:text-stone-800">
                        {fullName}
                      </h2>
                      <PulsingContactBadge status={status} />
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${pipelineStageBadgeClass(pipelineStage)}`}
                      >
                        {PIPELINE_STAGE_LABELS[pipelineStage]}
                      </span>
                      <span
                        className="inline-flex shrink-0 items-center rounded-full border border-stone-500/25 bg-stone-700/10 px-2.5 py-1 text-[11px] font-bold tabular-nums text-stone-800"
                        title="Score de priorité"
                      >
                        {leadScore}
                      </span>
                      {Boolean(
                        (c as { followup_opt_out?: boolean }).followup_opt_out
                      ) ? (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-600/40 bg-zinc-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                          title="Relances email automatiques désactivées pour ce contact"
                        >
                          <BellOff className="h-3.5 w-3.5" aria-hidden />
                          Sans relance auto
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4 shrink-0 text-stone-600/80" />
                        {c.email as string}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0 text-amber-500/80" />
                        {c.phone as string}
                      </span>
                      <span className="font-medium text-slate-600">
                        {CONTACT_TYPE_LABELS[ctype]}
                      </span>
                      {budgetLabel ? (
                        <span className="tabular-nums text-slate-500">
                          {budgetLabel}
                        </span>
                      ) : null}
                      {typeof c.desired_city === "string" && c.desired_city ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-500">
                          <MapPin className="h-4 w-4 text-stone-600/70" />
                          {c.desired_city}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
