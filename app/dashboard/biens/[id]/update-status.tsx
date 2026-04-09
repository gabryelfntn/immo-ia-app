"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updatePropertyStatus } from "../actions";
import { PROPERTY_STATUS_LABELS } from "@/lib/properties/labels";
import { PROPERTY_STATUSES } from "@/lib/properties/schema";
import type { PropertyStatus } from "@/lib/properties/schema";

type Props = {
  propertyId: string;
  currentStatus: PropertyStatus;
};

export function UpdateStatusControl({ propertyId, currentStatus }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState(currentStatus);

  useEffect(() => {
    setValue(currentStatus);
  }, [currentStatus]);

  function onChange(next: PropertyStatus) {
    if (next === currentStatus) return;
    setError(null);
    setValue(next);
    startTransition(async () => {
      const result = await updatePropertyStatus(propertyId, next);
      if (!result.ok) {
        setError(result.error);
        setValue(currentStatus);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="property-status"
        className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
      >
        Modifier le statut
      </label>
      <select
        id="property-status"
        value={value}
        disabled={pending}
        onChange={(e) => onChange(e.target.value as PropertyStatus)}
        className="max-w-xs rounded-xl border border-white/[0.1] bg-[#0a0a0f] px-4 py-2.5 text-sm font-medium text-zinc-100 outline-none transition-all duration-300 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50"
      >
        {PROPERTY_STATUSES.map((s) => (
          <option key={s} value={s} className="bg-[#12121a]">
            {PROPERTY_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
