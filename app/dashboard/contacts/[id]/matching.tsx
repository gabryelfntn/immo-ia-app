"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useCallback, useState } from "react";

type MatchedProperty = {
  id: string;
  title: string;
  price: number;
  priceLabel: string;
  surface: number;
  city: string;
  transaction: string;
  image_url: string | null;
};

export type MatchResult = {
  propertyId: string;
  score: number;
  reason: string;
  property: MatchedProperty;
};

type Props = {
  contactId: string;
};

function scoreBarClass(score: number): string {
  if (score > 70) {
    return "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(52,211,153,0.45)]";
  }
  if (score > 40) {
    return "bg-gradient-to-r from-amber-500 to-orange-400";
  }
  return "bg-gradient-to-r from-rose-500 to-red-500";
}

function cardGlowClass(score: number): string {
  if (score > 70) {
    return "shadow-[0_0_40px_-12px_rgba(52,211,153,0.35)] border-emerald-500/25";
  }
  if (score > 40) {
    return "border-amber-500/20 shadow-[0_0_28px_-14px_rgba(245,158,11,0.2)]";
  }
  return "border-slate-200/90";
}

export function ContactMatching({ contactId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResult[] | null>(null);
  const [searched, setSearched] = useState(false);

  const onMatch = useCallback(async () => {
    setError(null);
    setLoading(true);
    setMatches(null);
    try {
      const res = await fetch("/api/match-properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId }),
      });
      const data = (await res.json()) as {
        error?: string;
        matches?: MatchResult[];
      };
      if (!res.ok) {
        setError(data.error ?? `Erreur ${res.status}`);
        setSearched(true);
        return;
      }
      setMatches(data.matches ?? []);
      setSearched(true);
    } catch {
      setError("Réseau indisponible ou réponse invalide.");
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Biens compatibles</h2>
          <p className="mt-1 text-sm text-slate-500">
            L&apos;IA compare votre contact aux biens{" "}
            <span className="text-violet-600">disponibles</span> de
            l&apos;agence (budget, ville, type, transaction).
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={onMatch}
          className="btn-luxury-primary inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles className="relative z-10 h-4 w-4" />
          <span className="relative z-10">
            {loading ? "Analyse en cours…" : "Trouver les biens compatibles"}
          </span>
        </button>
      </div>

      {loading ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/90 bg-slate-50/90 py-16"
          aria-busy="true"
          aria-live="polite"
        >
          <span
            className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-400"
            aria-hidden
          />
          <p className="mt-4 text-sm font-medium text-slate-500">
            Claude analyse les biens et le profil du contact…
          </p>
        </div>
      ) : null}

      {error && !loading ? (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {searched && !loading && !error && matches?.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/80 px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-500">
            Aucun bien disponible ne correspond assez à ce profil, ou aucun bien
            n&apos;est en statut « Disponible » pour l&apos;instant.
          </p>
        </div>
      ) : null}

      {matches && matches.length > 0 ? (
        <ul className="flex flex-col gap-5">
          {matches.map((m) => {
            const p = m.property;
            const pct = Math.min(100, Math.max(0, m.score));
            return (
              <li key={m.propertyId}>
                <Link
                  href={`/dashboard/biens/${p.id}`}
                  className={`group card-luxury flex flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-0.5 md:flex-row ${cardGlowClass(m.score)}`}
                >
                  <div className="relative aspect-[16/10] w-full shrink-0 bg-gradient-to-br from-slate-100 to-slate-200/90 md:aspect-auto md:h-auto md:w-52 md:min-h-[200px]">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt=""
                        className="h-full w-full object-cover md:absolute md:inset-0"
                      />
                    ) : (
                      <div className="flex h-full min-h-[10rem] items-center justify-center text-4xl opacity-30 md:min-h-full">
                        🏠
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-violet-300">
                          {p.title}
                        </h3>
                        <p className="mt-1 text-xl font-semibold tabular-nums text-amber-400/95">
                          {p.priceLabel}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          {p.surface} m² · {p.city}
                        </p>
                      </div>
                      <div
                        className={`shrink-0 rounded-xl border border-slate-200/90 px-4 py-2 text-center ${
                          m.score > 70
                            ? "bg-emerald-500/10 shadow-[0_0_20px_-6px_rgba(52,211,153,0.5)]"
                            : "bg-slate-50"
                        }`}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Score
                        </p>
                        <p className="text-2xl font-bold tabular-nums text-violet-600">
                          {m.score}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${scoreBarClass(m.score)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-slate-500">
                      {m.reason}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
