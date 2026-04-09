"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateFollowupOptOut } from "../actions";

type Props = {
  contactId: string;
  initialOptOut: boolean;
};

export function FollowupOptOutToggle({ contactId, initialOptOut }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(initialOptOut);

  useEffect(() => {
    setChecked(initialOptOut);
  }, [initialOptOut]);

  function onToggle(next: boolean) {
    setError(null);
    setChecked(next);
    startTransition(async () => {
      const result = await updateFollowupOptOut(contactId, next);
      if (!result.ok) {
        setError(result.error);
        setChecked(initialOptOut);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#12121a] p-5 card-luxury">
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
        Relances automatiques
      </p>
      <p className="mt-2 text-sm text-zinc-400">
        Si activé, ce contact ne recevra plus d&apos;emails de relance envoyés
        par l&apos;automatisation.
      </p>
      <label className="mt-4 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          disabled={pending}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded-md border border-white/20 bg-[#0c0c10] text-rose-500 shadow-[0_0_12px_-4px_rgba(244,63,94,0.35)] focus:ring-2 focus:ring-rose-500/30 focus:ring-offset-0 disabled:opacity-50"
        />
        <span className="text-sm font-medium text-zinc-200">
          {checked
            ? "Relances automatiques désactivées pour ce contact"
            : "Relances automatiques actives (emails automatiques possibles)"}
        </span>
      </label>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
