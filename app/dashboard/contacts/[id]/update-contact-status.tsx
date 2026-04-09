"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateContactStatus } from "../actions";
import { CONTACT_STATUS_LABELS } from "@/lib/contacts/labels";
import { CONTACT_STATUSES } from "@/lib/contacts/schema";
import type { ContactStatus } from "@/lib/contacts/schema";

type Props = {
  contactId: string;
  currentStatus: ContactStatus;
};

export function UpdateContactStatusControl({
  contactId,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState(currentStatus);

  useEffect(() => {
    setValue(currentStatus);
  }, [currentStatus]);

  function onChange(next: ContactStatus) {
    if (next === currentStatus) return;
    setError(null);
    setValue(next);
    startTransition(async () => {
      const result = await updateContactStatus(contactId, next);
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
        htmlFor="contact-status"
        className="text-xs font-semibold uppercase tracking-wider text-slate-500"
      >
        Modifier le statut
      </label>
      <select
        id="contact-status"
        value={value}
        disabled={pending}
        onChange={(e) => onChange(e.target.value as ContactStatus)}
        className="max-w-xs rounded-xl border border-slate-200/90 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all duration-300 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/25 disabled:opacity-50"
      >
        {CONTACT_STATUSES.map((s) => (
          <option key={s} value={s} className="bg-white">
            {CONTACT_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
