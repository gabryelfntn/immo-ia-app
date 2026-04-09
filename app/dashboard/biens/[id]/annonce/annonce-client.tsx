"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export type PropertyHeaderInfo = {
  title: string;
  typeLabel: string;
  transactionLabel: string;
  priceLabel: string;
  surface: string;
  rooms: number;
  bedrooms: number;
  city: string;
  zip_code: string;
  address: string;
};

export type GeneratedListingRow = {
  id: string;
  classique: string;
  dynamique: string;
  premium: string;
  created_at: string;
};

type Props = {
  propertyId: string;
  header: PropertyHeaderInfo;
  listings: GeneratedListingRow[];
};

function CopyTextButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    } catch {
      setDone(false);
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={onCopy}
      className="rounded-lg border border-slate-200/90 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition-all duration-300 hover:border-indigo-500/40 hover:bg-indigo-500/10"
    >
      {done ? "Copié !" : label}
    </button>
  );
}

function ThreeListingsColumns({
  classique,
  dynamique,
  premium,
}: {
  classique: string;
  dynamique: string;
  premium: string;
}) {
  const cols = [
    { key: "classique" as const, title: "Classique", body: classique },
    { key: "dynamique" as const, title: "Dynamique", body: dynamique },
    { key: "premium" as const, title: "Premium", body: premium },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {cols.map((c) => (
        <div
          key={c.key}
          className="card-luxury flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900">{c.title}</h3>
            <CopyTextButton text={c.body} label="Copier" />
          </div>
          <div className="flex-1 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {c.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AnnonceClient({ propertyId, header, listings }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? `Erreur ${res.status}`);
        return;
      }

      router.refresh();
    } catch {
      setError("Réseau indisponible ou réponse invalide.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury sm:p-8">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400/90">
          Bien concerné
        </h2>
        <p className="mt-4 text-xl font-bold text-slate-900">{header.title}</p>
        <p className="mt-2 text-lg font-semibold tabular-nums text-amber-400/90">
          {header.priceLabel}
        </p>
        <dl className="mt-6 grid gap-3 text-sm text-slate-500 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Type
            </dt>
            <dd className="mt-1 text-slate-700">{header.typeLabel}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Transaction
            </dt>
            <dd className="mt-1 text-slate-700">{header.transactionLabel}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Surface
            </dt>
            <dd className="mt-1 text-slate-700">{header.surface} m²</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Pièces
            </dt>
            <dd className="mt-1 text-slate-700">
              {header.rooms} pièces · {header.bedrooms} chambres
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Adresse
            </dt>
            <dd className="mt-1 text-slate-700">
              {header.address}, {header.zip_code} {header.city}
            </dd>
          </div>
        </dl>
      </section>

      <div className="relative">
        {loading ? (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center rounded-2xl bg-slate-50/85 pt-24 backdrop-blur-sm"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-8 py-6 shadow-2xl">
              <span
                className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-400"
                aria-hidden
              />
              <p className="text-sm font-semibold text-slate-700">
                Génération des annonces en cours…
              </p>
            </div>
          </div>
        ) : null}

        <div className={loading ? "min-h-[12rem] opacity-50" : ""}>
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white/[0.03] p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm text-slate-500">
              Claude génère trois tonalités (classique, dynamique, premium) à
              partir des données du bien.
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={onGenerate}
              className="btn-luxury-primary inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="relative z-10 h-4 w-4" />
              <span className="relative z-10">
                {loading ? "Génération…" : "Générer une annonce IA"}
              </span>
            </button>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">Annonces générées</h2>
        <p className="mt-2 text-sm text-slate-500">
          Les générations les plus récentes apparaissent en premier.
        </p>

        {listings.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-slate-200/90 bg-white/[0.03] px-6 py-12 text-center text-sm text-slate-500">
            Aucune annonce enregistrée pour ce bien. Utilisez le bouton ci-dessus
            pour lancer une première génération.
          </p>
        ) : (
          <ul className="mt-8 space-y-12">
            {listings.map((row, index) => (
              <li key={row.id}>
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-600">
                    {index === 0 ? "Plus récente" : "Génération"}
                  </span>
                  <time
                    dateTime={row.created_at}
                    className="text-xs text-slate-500"
                  >
                    {formatDate(row.created_at)}
                  </time>
                </div>
                <ThreeListingsColumns
                  classique={row.classique}
                  dynamique={row.dynamique}
                  premium={row.premium}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
