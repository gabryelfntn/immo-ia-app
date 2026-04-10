"use client";

import { useState } from "react";

export function OnboardingClient() {
  const [focus, setFocus] = useState<
    "general" | "relances" | "mandats" | "annonces" | "visites"
  >("general");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tip, setTip] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setErr(null);
    setTip(null);
    try {
      const res = await fetch("/api/ai-lab/onboarding-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focus,
          question: question.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string; tip?: string };
      if (!res.ok) {
        setErr(data.error ?? `Erreur ${res.status}`);
        return;
      }
      setTip(data.tip ?? null);
    } catch {
      setErr("Réseau ou serveur indisponible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-10 rounded-2xl border border-stone-200/90 bg-[#faf8f4] p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-900">
        Conseil personnalisé (IA)
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        Choisissez un thème et posez une question optionnelle.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        <label className="text-sm text-stone-700">
          Thème
          <select
            value={focus}
            onChange={(e) => setFocus(e.target.value as typeof focus)}
            className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
          >
            <option value="general">Démarrage général</option>
            <option value="relances">Relances</option>
            <option value="mandats">Mandats</option>
            <option value="annonces">Annonces</option>
            <option value="visites">Visites</option>
          </select>
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder="Ex. : par quoi commencer cette semaine avec peu de mandats ?"
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400"
        />
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          className="w-fit rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {loading ? "Génération…" : "Générer le conseil"}
        </button>
      </div>
      {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
      {tip ? (
        <div className="mt-4 whitespace-pre-wrap rounded-xl border border-stone-200 bg-white p-4 text-sm leading-relaxed text-stone-800">
          {tip}
        </div>
      ) : null}
    </section>
  );
}
