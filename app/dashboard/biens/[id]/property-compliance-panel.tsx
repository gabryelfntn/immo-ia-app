"use client";

import { useState } from "react";
import { updatePropertyCompliance } from "../actions";

type Props = {
  propertyId: string;
  initialEnergy: string | null;
  initialDiag: string | null;
  initialMandateEnd: string | null;
};

export function PropertyCompliancePanel({
  propertyId,
  initialEnergy,
  initialDiag,
  initialMandateEnd,
}: Props) {
  const [energy, setEnergy] = useState(initialEnergy ?? "");
  const [diag, setDiag] = useState(initialDiag ?? "");
  const [mandate, setMandate] = useState(initialMandateEnd ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function saveDates() {
    setMsg(null);
    setLoading(true);
    const r = await updatePropertyCompliance(propertyId, {
      energy_rating: energy || null,
      diagnostics_valid_until: diag || null,
      mandate_expires_at: mandate || null,
    });
    setLoading(false);
    setMsg(r.ok ? "Enregistré." : r.error);
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800/90">
        Conformité & mandat (indicatif)
      </h2>
      <p className="mt-2 text-xs text-slate-600">
        Dates et mentions utiles en interne. La checklist détaillée (DPE,
        diagnostics, mandat…) reste dans le bloc « Extras CRM » au-dessus.
        Rien ici ne constitue un avis juridique.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="text-slate-500">Classe énergie (affichage)</span>
          <input
            value={energy}
            onChange={(e) => setEnergy(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            maxLength={8}
            placeholder="ex. D"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-500">Fin diagnostics</span>
          <input
            type="date"
            value={diag}
            onChange={(e) => setDiag(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-500">Fin mandat</span>
          <input
            type="date"
            value={mandate}
            onChange={(e) => setMandate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={() => void saveDates()}
        className="mt-4 rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "…" : "Enregistrer"}
      </button>
      {msg ? (
        <p className="mt-2 text-sm text-slate-600" role="status">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
