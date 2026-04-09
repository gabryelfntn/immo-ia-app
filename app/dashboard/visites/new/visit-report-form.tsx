"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Save, Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

type Option = { id: string; label: string };

export type VisitReportApiShape = {
  id: string;
  visitDate: string;
  saved: boolean;
  summary: string;
  positivePoints: string[];
  negativePoints: string[];
  clientInterest: "fort" | "moyen" | "faible";
  recommendation: string;
  nextStep: string;
};

type Props = {
  properties: Option[];
  contacts: Option[];
};

function todayISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function interestPanelClass(interest: string): string {
  switch (interest) {
    case "fort":
      return "border-emerald-500/30 bg-emerald-500/[0.08] shadow-[0_0_32px_-12px_rgba(52,211,153,0.35)]";
    case "moyen":
      return "border-amber-500/25 bg-amber-500/[0.06] shadow-[0_0_24px_-12px_rgba(245,158,11,0.2)]";
    case "faible":
      return "border-rose-500/25 bg-rose-500/[0.06]";
    default:
      return "border-slate-200/90 bg-slate-50/90";
  }
}

function interestTitle(interest: string): string {
  switch (interest) {
    case "fort":
      return "Intérêt client : fort";
    case "moyen":
      return "Intérêt client : moyen";
    case "faible":
      return "Intérêt client : faible";
    default:
      return "Intérêt client";
  }
}

export function VisitReportForm({ properties, contacts }: Props) {
  const router = useRouter();
  const [propertyId, setPropertyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [visitDate, setVisitDate] = useState(todayISODate);
  const [visitNotes, setVisitNotes] = useState("");
  const [report, setReport] = useState<VisitReportApiShape | null>(null);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      propertyId.length > 0 &&
      contactId.length > 0 &&
      visitDate.length > 0 &&
      visitNotes.trim().length > 0
    );
  }, [propertyId, contactId, visitDate, visitNotes]);

  const onGenerate = useCallback(async () => {
    if (!canSubmit) return;
    setError(null);
    setLoadingGenerate(true);
    setReport(null);
    try {
      const res = await fetch("/api/generate-visit-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          contactId,
          visitDate,
          visitNotes: visitNotes.trim(),
          dryRun: true,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        report?: VisitReportApiShape;
      };
      if (!res.ok) {
        setError(data.error ?? `Erreur ${res.status}`);
        return;
      }
      if (!data.report) {
        setError("Réponse API inattendue.");
        return;
      }
      setReport(data.report);
    } catch {
      setError("Réseau indisponible ou réponse invalide.");
    } finally {
      setLoadingGenerate(false);
    }
  }, [canSubmit, propertyId, contactId, visitDate, visitNotes]);

  const onSave = useCallback(async () => {
    if (!canSubmit || !report) return;
    setError(null);
    setLoadingSave(true);
    try {
      const res = await fetch("/api/generate-visit-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          contactId,
          visitDate,
          visitNotes: visitNotes.trim(),
          report: {
            summary: report.summary,
            positivePoints: report.positivePoints,
            negativePoints: report.negativePoints,
            clientInterest: report.clientInterest,
            recommendation: report.recommendation,
            nextStep: report.nextStep,
          },
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        report?: VisitReportApiShape;
      };
      if (!res.ok) {
        setError(data.error ?? `Erreur ${res.status}`);
        return;
      }
      if (data.report?.saved) {
        setReport(data.report);
        router.push("/dashboard/visites");
        router.refresh();
      }
    } catch {
      setError("Réseau indisponible ou réponse invalide.");
    } finally {
      setLoadingSave(false);
    }
  }, [canSubmit, report, propertyId, contactId, visitDate, visitNotes, router]);

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury sm:p-8">
          <h2 className="text-lg font-bold text-slate-900">Détails de la visite</h2>
          <p className="mt-1 text-sm text-slate-500">
            Sélectionnez le bien et le contact, puis saisissez vos notes libres :
            l&apos;IA structurera le compte-rendu.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="visit-property"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                Bien visité
              </label>
              <select
                id="visit-property"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full rounded-xl border border-slate-200/90 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-stone-400 focus:ring-2 focus:ring-stone-500/20"
              >
                <option value="">Choisir un bien…</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="visit-contact"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                Contact
              </label>
              <select
                id="visit-contact"
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full rounded-xl border border-slate-200/90 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-stone-400 focus:ring-2 focus:ring-stone-500/20"
              >
                <option value="">Choisir un contact…</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="visit-date"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                Date de visite
              </label>
              <input
                id="visit-date"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200/90 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-stone-400 focus:ring-2 focus:ring-stone-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="visit-notes"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                Notes brutes
              </label>
              <textarea
                id="visit-notes"
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                rows={8}
                placeholder="Impressions du client, points forts/faibles du bien, objections, ambiance du quartier…"
                className="w-full resize-y rounded-xl border border-slate-200/90 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700 placeholder:text-slate-600 outline-none transition-all focus:border-stone-400 focus:ring-2 focus:ring-stone-500/20"
              />
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={!canSubmit || loadingGenerate}
              onClick={onGenerate}
              className="btn-luxury-primary inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-45"
            >
              {loadingGenerate ? (
                <Loader2 className="relative z-10 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="relative z-10 h-4 w-4" />
              )}
              <span className="relative z-10">
                {loadingGenerate ? "Génération…" : "Générer le rapport IA"}
              </span>
            </button>
            <button
              type="button"
              disabled={!canSubmit || !report || report.saved || loadingSave}
              onClick={onSave}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-200 shadow-[0_0_24px_-10px_rgba(52,211,153,0.25)] transition-all hover:border-emerald-400/45 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loadingSave ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Sauvegarder le rapport
            </button>
          </div>

          <p className="mt-4 text-xs text-slate-600">
            L&apos;enregistrement en base se fait au clic sur « Sauvegarder le
            rapport ». « Générer » prévisualise uniquement (aucune ligne créée).
          </p>
        </div>
      </div>

      <div className="min-h-[320px]">
        {!report ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-white/[0.025] px-6 py-16 text-center">
            <Sparkles className="mb-4 h-10 w-10 text-stone-700/40" />
            <p className="text-sm font-medium text-slate-500">
              Le rapport structuré apparaîtra ici après génération.
            </p>
          </div>
        ) : (
          <div
            className={`rounded-2xl border p-6 sm:p-8 ${interestPanelClass(report.clientInterest)}`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Aperçu
            </p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">
              {interestTitle(report.clientInterest)}
            </h3>

            <section className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500/90">
                Synthèse
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {report.summary}
              </p>
            </section>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <section>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400/90">
                  Points positifs
                </h4>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-500">
                  {report.positivePoints.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400/85">
                  Points négatifs
                </h4>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-500">
                  {report.negativePoints.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="mt-8 rounded-xl border border-slate-100 bg-black/20 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Recommandation
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {report.recommendation}
              </p>
            </section>

            <section className="mt-4 rounded-xl border border-slate-100 bg-black/20 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Prochaine étape
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {report.nextStep}
              </p>
            </section>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard/visites"
                className="text-sm font-medium text-slate-500 underline-offset-4 transition-colors hover:text-amber-400 hover:underline"
              >
                ← Retour aux visites
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
