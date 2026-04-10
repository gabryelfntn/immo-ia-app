"use client";

import { useState } from "react";

export function ContactDocumentAi({ contactId }: { contactId: string }) {
  const [raw, setRaw] = useState("");
  const [out, setOut] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/suggest-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: raw, contactId }),
      });
      const j = (await res.json()) as { error?: string; data?: unknown };
      if (!res.ok) {
        setErr(j.error ?? "Erreur");
        return;
      }
      setOut(JSON.stringify(j.data, null, 2));
    } catch {
      setErr("Échec réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm">
        <span className="text-slate-600">
          Colle le texte extrait d’un PDF ou d’un mail (mandat, annonce…).
        </span>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={6}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Texte source…"
        />
      </label>
      <button
        type="button"
        disabled={loading || raw.trim().length < 20}
        onClick={() => void run()}
        className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "…" : "Suggérer des champs"}
      </button>
      {err ? (
        <p className="text-sm text-red-700" role="alert">
          {err}
        </p>
      ) : null}
      {out ? (
        <pre className="max-h-64 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
          {out}
        </pre>
      ) : null}
      <p className="text-xs text-slate-500">
        Indicatif uniquement — valide manuellement avant mise à jour CRM.
      </p>
    </div>
  );
}
