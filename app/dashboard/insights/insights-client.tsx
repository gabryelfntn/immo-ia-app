"use client";

import { useState } from "react";

export function InsightsClient() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOut(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/analytics-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q }),
      });
      const j = (await res.json()) as {
        error?: string;
        metricId?: string;
        result?: unknown;
        interpretation?: string;
      };
      if (!res.ok) {
        setErr(j.error ?? "Erreur.");
        return;
      }
      setOut(
        `${j.interpretation ?? ""}\n\nDonnées : ${JSON.stringify(j.result, null, 2)}`
      );
    } catch {
      setErr("Échec réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        <span className="text-slate-600">
          Pose une question sur ton activité (ex. « combien de contacts ? »,
          « répartition pipeline », « biens par statut »).
        </span>
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Ex. Combien de visites ce mois-ci ?"
        />
      </label>
      <button
        type="submit"
        disabled={loading || q.trim().length < 3}
        className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Analyse…" : "Analyser"}
      </button>
      {err ? (
        <p className="text-sm text-red-700" role="alert">
          {err}
        </p>
      ) : null}
      {out ? (
        <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800">
          {out}
        </pre>
      ) : null}
      <p className="text-xs text-slate-500">
        Les réponses agrègent uniquement les données de ton périmètre (agent
        ou agence). Aucune requête SQL arbitraire : métriques prédéfinies
        côté serveur.
      </p>
    </form>
  );
}
