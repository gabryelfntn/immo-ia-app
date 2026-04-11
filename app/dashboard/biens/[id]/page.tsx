import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
  TRANSACTION_LABELS,
  formatPriceEUR,
  statusBadgeClass,
} from "@/lib/properties/labels";
import type { PropertyStatus, PropertyType } from "@/lib/properties/schema";
import { PropertyGallery } from "./property-gallery";
import { UpdateStatusControl } from "./update-status";
import { RecordRecentView } from "@/app/dashboard/_components/record-recent-view";
import { CopyTextButton } from "@/app/dashboard/_components/copy-text-button";
import { PropertyCrmExtrasPanel } from "./property-crm-extras-panel";
import { PropertyCompliancePanel } from "./property-compliance-panel";
import { PropertyTimelineSection } from "./property-timeline-section";
import { PropertyContactLinksPanel } from "./property-contact-links-panel";
import { parseMandateChecklist } from "@/lib/properties/mandate-checklist";
import { buildPropertyTimeline } from "@/lib/activity/property-timeline";

type Props = { params: Promise<{ id: string }> };

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-slate-100 py-4 last:border-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium text-slate-900">{children}</dd>
    </div>
  );
}

function PulsingStatusBadge({
  status,
}: {
  status: PropertyStatus;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200/90 px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md ${statusBadgeClass(status)}`}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-90 animate-pulse"
        aria-hidden
      />
      {PROPERTY_STATUS_LABELS[status]}
    </span>
  );
}

export default async function PropertyDetailPage({ params }: Props) {
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
      <div className="mx-auto max-w-5xl">
        <p className="text-sm text-slate-500">Aucune agence associée.</p>
      </div>
    );
  }

  const { data: row, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("agency_id", profile.agency_id)
    .maybeSingle();

  if (error || !row) {
    notFound();
  }

  const { data: photoRows, error: photosError } = await supabase
    .from("property_photos")
    .select("id, url, is_main, created_at")
    .eq("property_id", id)
    .order("is_main", { ascending: false })
    .order("created_at", { ascending: true });

  const photos =
    !photosError && photoRows
      ? photoRows.map((p) => ({
          id: p.id as string,
          url: p.url as string,
          is_main: Boolean(p.is_main),
        }))
      : [];

  const status = row.status as PropertyStatus;
  const ptype = row.type as PropertyType;
  const transaction = row.transaction as "vente" | "location";
  const title = row.title as string;
  const fallbackImage =
    typeof row.image_url === "string" && row.image_url.trim()
      ? row.image_url.trim()
      : null;

  const priceLabel = formatPriceEUR(Number(row.price), transaction);

  const rowExt = row as {
    listing_url?: string | null;
    mandate_checklist?: unknown;
    energy_rating?: string | null;
    diagnostics_valid_until?: string | null;
    mandate_expires_at?: string | null;
  };
  const listingUrl =
    typeof rowExt.listing_url === "string" ? rowExt.listing_url : null;
  const checklist = parseMandateChecklist(rowExt.mandate_checklist);

  const { data: historyRows, error: historyError } = await supabase
    .from("property_price_history")
    .select("id, price, recorded_at")
    .eq("property_id", id)
    .order("recorded_at", { ascending: false })
    .limit(30);

  const priceHistory =
    !historyError && historyRows
      ? historyRows.map((h) => ({
          id: h.id as string,
          price: Number(h.price),
          recorded_at: h.recorded_at as string,
        }))
      : [];

  const propertyTimeline = await buildPropertyTimeline(
    supabase,
    id,
    profile.agency_id as string
  );

  const agencyIdStr = profile.agency_id as string;

  const [{ data: contactLinkRows }, { data: contactPickList }] =
    await Promise.all([
      supabase
        .from("contact_property_links")
        .select(
          `
          id,
          link_type,
          note,
          contact_id,
          contacts ( first_name, last_name )
        `
        )
        .eq("property_id", id)
        .eq("agency_id", agencyIdStr)
        .order("created_at", { ascending: false }),
      supabase
        .from("contacts")
        .select("id, first_name, last_name")
        .eq("agency_id", agencyIdStr)
        .order("last_name", { ascending: true })
        .limit(200),
    ]);

  const contactLinksForProperty =
    contactLinkRows?.map((row) => {
      const raw = row.contacts;
      const c = Array.isArray(raw) ? raw[0] : raw;
      return {
        id: row.id as string,
        link_type: row.link_type as string,
        note: (row.note as string | null) ?? null,
        contact_id: row.contact_id as string,
        contacts: c
          ? {
              first_name: String((c as { first_name?: string }).first_name ?? ""),
              last_name: String((c as { last_name?: string }).last_name ?? ""),
            }
          : null,
      };
    }) ?? [];

  const contactOptions =
    contactPickList?.map((c) => ({
      id: c.id as string,
      first_name: c.first_name as string,
      last_name: c.last_name as string,
    })) ?? [];

  const addressLine = `${row.address as string}, ${row.zip_code as string} ${row.city as string}`;

  return (
    <div className="mx-auto max-w-6xl">
      <RecordRecentView
        kind="property"
        id={id}
        title={title}
        href={`/dashboard/biens/${id}`}
      />
      <Link
        href="/dashboard/biens"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-all duration-300 hover:text-stone-800"
      >
        <span aria-hidden>←</span> Retour aux biens
      </Link>

      <div className="mt-6">
        <PropertyGallery
          photos={photos}
          fallbackImageUrl={fallbackImage}
          title={title}
          hero={{
            priceLabel,
            statusBadge: <PulsingStatusBadge status={status} />,
          }}
        />
      </div>

      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white/[0.03] p-5 backdrop-blur-sm sm:flex-row sm:items-end sm:justify-between">
        <UpdateStatusControl propertyId={id} currentStatus={status} />
        <Link
          href={`/dashboard/biens/${id}/annonce`}
          className="btn-luxury-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all duration-300"
        >
          <Sparkles className="relative z-10 h-4 w-4" />
          <span className="relative z-10">Générer une annonce IA</span>
        </Link>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-800">
            Caractéristiques
          </h2>
          <dl className="mt-4">
            <DetailRow label="Type de bien">
              {PROPERTY_TYPE_LABELS[ptype]}
            </DetailRow>
            <DetailRow label="Transaction">
              {TRANSACTION_LABELS[transaction]}
            </DetailRow>
            <DetailRow label="Surface habitable">{row.surface} m²</DetailRow>
            <DetailRow label="Pièces">{row.rooms as number} pièces</DetailRow>
            <DetailRow label="Chambres">
              {row.bedrooms as number} chambres
            </DetailRow>
            <DetailRow label="Prix">{priceLabel}</DetailRow>
            <DetailRow label="Statut">
              <PulsingStatusBadge status={status} />
            </DetailRow>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500/90">
            Adresse complète
          </h2>
          <address className="mt-6 not-italic">
            <p className="text-lg font-semibold text-slate-900">
              {row.address as string}
            </p>
            <p className="mt-2 text-slate-500">
              {(row.zip_code as string) + " " + (row.city as string)}
            </p>
            <div className="mt-3">
              <CopyTextButton text={addressLine} label="Copier l’adresse" />
            </div>
          </address>
        </section>
      </div>

      <div className="mt-8">
        <PropertyContactLinksPanel
          propertyId={id}
          initialLinks={contactLinksForProperty}
          contactOptions={contactOptions}
        />
      </div>

      <div className="mt-8">
        <PropertyCrmExtrasPanel
          propertyId={id}
          transaction={transaction}
          currentPrice={Number(row.price)}
          initialListingUrl={listingUrl}
          initialChecklist={checklist}
          priceHistory={priceHistory}
        />
      </div>

      <div className="mt-8">
        <PropertyCompliancePanel
          propertyId={id}
          initialEnergy={rowExt.energy_rating ?? null}
          initialDiag={
            rowExt.diagnostics_valid_until
              ? String(rowExt.diagnostics_valid_until).slice(0, 10)
              : ""
          }
          initialMandateEnd={
            rowExt.mandate_expires_at
              ? String(rowExt.mandate_expires_at).slice(0, 10)
              : ""
          }
        />
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-800">
          Chronologie (bien)
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Visites, tâches et historique de prix.
        </p>
        <div className="mt-4">
          <PropertyTimelineSection items={propertyTimeline} />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          Description
        </h2>
        <div className="mt-5">
          {(row.description as string | null)?.trim() ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {row.description as string}
            </p>
          ) : (
            <p className="text-sm italic text-slate-600">
              Aucune description renseignée pour ce bien.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
