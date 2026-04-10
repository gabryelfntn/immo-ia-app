"use client";

import { useState } from "react";

export function ContactCopilotPanel({ contactId }: { contactId: string }) {
  const [md, setMd] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/contact-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId }),
      });
      const j = (await res.json()) as { error?: string; markdown?: string };
      if (!res.ok) {
        setErr(j.error ?? "Erreur");
        return;
      }
      setMd(j.markdown ?? "");
    } catch {
      setErr("Échec réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Analyse…" : "Générer synthèse & actions"}
        </button>
        <a
          href="/dashboard/outils-ia"
          className="text-xs font-medium text-amber-900 hover:underline"
        >
          Dictée & outils IA →
        </a>
      </div>
      {err ? (
        <p className="text-sm text-red-700" role="alert">
          {err}
        </p>
      ) : null}
      {md ? (
        <div className="prose prose-sm max-w-none rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-slate-800">
          <pre className="whitespace-pre-wrap font-sans text-sm">{md}</pre>
        </div>
      ) : null}
    </div>
  );
}
