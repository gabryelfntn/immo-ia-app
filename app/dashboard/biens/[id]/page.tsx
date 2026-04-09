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

type Props = { params: Promise<{ id: string }> };

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-white/[0.06] py-4 last:border-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium text-zinc-100">{children}</dd>
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
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md ${statusBadgeClass(status)}`}
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
        <p className="text-sm text-zinc-500">Aucune agence associée.</p>
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

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/dashboard/biens"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-all duration-300 hover:text-indigo-300"
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

      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#12121a]/80 p-5 backdrop-blur-sm sm:flex-row sm:items-end sm:justify-between">
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
        <section className="rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 card-luxury">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300/90">
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

        <section className="rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 card-luxury">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500/90">
            Adresse complète
          </h2>
          <address className="mt-6 not-italic">
            <p className="text-lg font-semibold text-white">
              {row.address as string}
            </p>
            <p className="mt-2 text-zinc-400">
              {(row.zip_code as string) + " " + (row.city as string)}
            </p>
          </address>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 card-luxury">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
          Description
        </h2>
        <div className="mt-5">
          {(row.description as string | null)?.trim() ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
              {row.description as string}
            </p>
          ) : (
            <p className="text-sm italic text-zinc-600">
              Aucune description renseignée pour ce bien.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
