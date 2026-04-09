import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CONTACT_STATUS_LABELS,
  CONTACT_TYPE_LABELS,
  contactStatusBadgeClass,
} from "@/lib/contacts/labels";
import type { ContactStatus, ContactType } from "@/lib/contacts/schema";
import { FollowupOptOutToggle } from "./followup-opt-out-toggle";
import { ContactMatching } from "./matching";
import { ContactNotesForm } from "./contact-notes-form";
import { UpdateContactStatusControl } from "./update-contact-status";

type Props = { params: Promise<{ id: string }> };

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
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-md ${contactStatusBadgeClass(status)}`}
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

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/contacts"
        className="text-sm font-medium text-zinc-400 transition-all duration-300 hover:text-indigo-300"
      >
        ← Retour aux contacts
      </Link>

      <div className="mt-8 flex flex-col gap-6 rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 card-luxury sm:flex-row sm:items-start sm:justify-between">
        <div>
          <PulsingContactBadge status={status} />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
            {fullName}
          </h1>
          <p className="mt-3 text-sm text-zinc-400">{row.email as string}</p>
          <p className="mt-1 text-sm text-zinc-400">{row.phone as string}</p>
        </div>
        <div className="shrink-0 rounded-xl border border-white/[0.06] bg-[#0a0a0f]/80 p-4">
          <UpdateContactStatusControl contactId={id} currentStatus={status} />
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <dl className="rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 card-luxury">
          <dt className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            Type
          </dt>
          <dd className="mt-2 font-medium text-zinc-100">
            {CONTACT_TYPE_LABELS[ctype]}
          </dd>
          <dt className="mt-6 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            Statut
          </dt>
          <dd className="mt-2 font-medium text-zinc-100">
            {CONTACT_STATUS_LABELS[status]}
          </dd>
        </dl>
        <dl className="rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 card-luxury">
          <dt className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            Budget
          </dt>
          <dd className="mt-2 font-medium text-zinc-100">
            {budgetLabel ?? "—"}
          </dd>
          <dt className="mt-6 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            Ville recherchée
          </dt>
          <dd className="mt-2 font-medium text-zinc-100">
            {typeof row.desired_city === "string" && row.desired_city.trim()
              ? row.desired_city
              : "—"}
          </dd>
        </dl>
      </div>

      <div className="mt-6">
        <FollowupOptOutToggle contactId={id} initialOptOut={followupOptOut} />
      </div>

      <section className="mt-8 rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 sm:p-8 card-luxury">
        <ContactMatching contactId={id} />
      </section>

      <section className="mt-6 rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 card-luxury">
        <ContactNotesForm contactId={id} initialNotes={notesText} />
      </section>
    </div>
  );
}
