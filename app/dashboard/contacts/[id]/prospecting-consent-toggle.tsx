"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateProspectingConsent } from "../actions";

type Props = {
  contactId: string;
  initialConsent: boolean;
};

export function ProspectingConsentToggle({
  contactId,
  initialConsent,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(initialConsent);

  useEffect(() => {
    setChecked(initialConsent);
  }, [initialConsent]);

  function onToggle(next: boolean) {
    setError(null);
    setChecked(next);
    startTransition(async () => {
      const result = await updateProspectingConsent(contactId, next);
      if (!result.ok) {
        setError(result.error);
        setChecked(initialConsent);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#12121a] p-5 card-luxury">
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
        Prospection (RGPD)
      </p>
      <p className="mt-2 text-sm text-zinc-400">
        Indique si le contact accepte d&apos;être sollicité pour des offres
        commerciales (appels, emails prospection hors relances auto).
      </p>
      <label className="mt-4 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          disabled={pending}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded-md border border-white/20 bg-[#0c0c10] text-emerald-500 shadow-[0_0_12px_-4px_rgba(16,185,129,0.35)] focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-0 disabled:opacity-50"
        />
        <span className="text-sm font-medium text-zinc-200">
          {checked
            ? "Prospection commerciale autorisée"
            : "Pas de prospection commerciale (hors obligations légales)"}
        </span>
      </label>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
