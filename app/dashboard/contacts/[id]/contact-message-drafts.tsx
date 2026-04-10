"use client";

import { useState } from "react";

const SCENARIOS = [
  { id: "post_visit", label: "Après visite" },
  { id: "relance", label: "Relance douce" },
  { id: "refus", label: "Refus / non retenu" },
  { id: "sms_flash", label: "SMS court" },
] as const;

export function ContactMessageDrafts({ contactId }: { contactId: string }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function draft(scenario: string) {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/draft-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, scenario }),
      });
      const j = (await res.json()) as { error?: string; text?: string };
      if (!res.ok) {
        setErr(j.error ?? "Erreur");
        return;
      }
      setText(j.text ?? "");
    } catch {
      setErr("Échec réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={loading}
            onClick={() => void draft(s.id)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:border-stone-400 disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
      </div>
      {err ? (
        <p className="text-sm text-red-700" role="alert">
          {err}
        </p>
      ) : null}
      {text ? (
        <textarea
          readOnly
          value={text}
          rows={8}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
        />
      ) : null}
      <p className="text-xs text-slate-500">
        Brouillon à copier-coller ; vérifie le ton et le contenu avant envoi.
      </p>
    </div>
  );
}
