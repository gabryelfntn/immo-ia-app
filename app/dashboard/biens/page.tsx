import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MapPin, Maximize, Plus, DoorOpen } from "lucide-react";
import {
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  propertyStatusEnum,
  propertyTypeEnum,
} from "@/lib/properties/schema";
import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
  TRANSACTION_LABELS,
  formatPriceEUR,
  statusBadgeClass,
} from "@/lib/properties/labels";
import type { PropertyStatus, PropertyType } from "@/lib/properties/schema";

type Search = { status?: string; type?: string };

function parseStatusFilter(raw: string | undefined): PropertyStatus | undefined {
  if (!raw) return undefined;
  const r = propertyStatusEnum.safeParse(raw);
  return r.success ? r.data : undefined;
}

function parseTypeFilter(raw: string | undefined): PropertyType | undefined {
  if (!raw) return undefined;
  const r = propertyTypeEnum.safeParse(raw);
  return r.success ? r.data : undefined;
}

type Props = { searchParams?: Promise<Search> };

function PulsingPropertyBadge({ status }: { status: PropertyStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-3 py-1 text-xs font-semibold backdrop-blur-md ${statusBadgeClass(status)}`}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-current animate-pulse"
        aria-hidden
      />
      {PROPERTY_STATUS_LABELS[status]}
    </span>
  );
}

export default async function BiensPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const statusFilter = parseStatusFilter(sp.status);
  const typeFilter = parseTypeFilter(sp.type);

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
        <h1 className="text-3xl font-bold text-zinc-50">Biens</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Aucune agence associée à votre compte.
        </p>
      </div>
    );
  }

  let query = supabase
    .from("properties")
    .select("*")
    .eq("agency_id", profile.agency_id)
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }
  if (typeFilter) {
    query = query.eq("type", typeFilter);
  }

  const { data: properties, error } = await query;

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-zinc-50">Biens</h1>
        <p className="mt-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error.message}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Vérifiez que la table{" "}
          <code className="rounded bg-white/[0.06] px-1">properties</code> existe dans
          Supabase avec les colonnes attendues.
        </p>
      </div>
    );
  }

  const list = properties ?? [];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400/90">
            Portefeuille
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-50">
            Biens
          </h1>
          <p className="mt-2 text-zinc-500">
            {list.length} bien{list.length !== 1 ? "s" : ""} pour votre agence
          </p>
        </div>
        <Link
          href="/dashboard/biens/new"
          className="btn-luxury-primary inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all duration-300"
        >
          <Plus className="relative z-10 h-5 w-5" strokeWidth={2.5} />
          <span className="relative z-10">Ajouter un bien</span>
        </Link>
      </div>

      <form
        action="/dashboard/biens"
        method="get"
        className="mt-10 flex flex-wrap items-center gap-3"
      >
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2 backdrop-blur-sm">
          <span className="hidden px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:inline">
            Filtres
          </span>
          <select
            id="filter-status"
            name="status"
            defaultValue={statusFilter ?? ""}
            className="rounded-full border border-white/[0.08] bg-[#0c0c10] px-4 py-2 text-sm font-medium text-zinc-200 outline-none transition-all duration-300 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Tous les statuts</option>
            {PROPERTY_STATUSES.map((s) => (
              <option key={s} value={s} className="bg-[#12121a]">
                {PROPERTY_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            id="filter-type"
            name="type"
            defaultValue={typeFilter ?? ""}
            className="rounded-full border border-white/[0.08] bg-[#0c0c10] px-4 py-2 text-sm font-medium text-zinc-200 outline-none transition-all duration-300 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Tous les types</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t} className="bg-[#12121a]">
                {PROPERTY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full bg-indigo-500/20 px-5 py-2 text-sm font-semibold text-violet-700 transition-all duration-300 hover:bg-indigo-500/30"
          >
            Appliquer
          </button>
        </div>
        {(statusFilter || typeFilter) && (
          <Link
            href="/dashboard/biens"
            className="text-sm font-medium text-zinc-500 transition-all duration-300 hover:text-amber-400"
          >
            Réinitialiser
          </Link>
        )}
      </form>

      {list.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.03] px-8 py-20 text-center">
          <p className="text-xl font-semibold text-zinc-200">
            Aucun bien pour l&apos;instant
          </p>
          <p className="mt-2 max-w-md text-sm text-zinc-500">
            Ajoutez votre premier bien pour le retrouver ici et générer des annonces IA.
          </p>
          <Link
            href="/dashboard/biens/new"
            className="btn-luxury-primary mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
          >
            <Plus className="relative z-10 h-5 w-5" />
            <span className="relative z-10">Ajouter un bien</span>
          </Link>
        </div>
      ) : (
        <ul className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => {
            const status = p.status as PropertyStatus;
            const ptype = p.type as PropertyType;
            const transaction = p.transaction as "vente" | "location";
            return (
              <li key={p.id}>
                <Link
                  href={`/dashboard/biens/${p.id}`}
                  className="card-luxury group block overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12121a] shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#1a1a24] to-[#12121a]">
                    {typeof p.image_url === "string" && p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl opacity-30">
                        🏠
                      </div>
                    )}
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
                      aria-hidden
                    />
                    <div className="absolute left-4 top-4 z-10">
                      <PulsingPropertyBadge status={status} />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="text-2xl font-bold tabular-nums text-white drop-shadow-lg sm:text-3xl">
                        {formatPriceEUR(Number(p.price), transaction)}
                      </p>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="line-clamp-2 text-lg font-semibold text-zinc-50 transition-colors duration-300 group-hover:text-violet-300">
                      {p.title}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-500">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-amber-500/80" />
                        {p.city as string}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Maximize className="h-4 w-4 text-indigo-400/80" />
                        {p.surface} m²
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <DoorOpen className="h-4 w-4 text-violet-400/80" />
                        {p.rooms} p. · {p.bedrooms} ch.
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium uppercase tracking-wider text-zinc-600">
                      {PROPERTY_TYPE_LABELS[ptype]} ·{" "}
                      {TRANSACTION_LABELS[transaction]}
                    </p>
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
