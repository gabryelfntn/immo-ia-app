"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { updateContactNotes } from "../actions";

type Props = {
  contactId: string;
  initialNotes: string;
};

export function ContactNotesForm({ contactId, initialNotes }: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateContactNotes(contactId, notes);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-4 py-3 text-sm text-zinc-100 outline-none transition-all duration-300 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label
        htmlFor="contact-notes"
        className="text-xs font-bold uppercase tracking-[0.15em] text-amber-500/90"
      >
        Notes
      </label>
      <textarea
        id="contact-notes"
        rows={6}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className={`${inputClass} resize-y`}
        placeholder="Ajoutez des informations sur ce contact…"
        maxLength={10000}
      />
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      <div>
        <button
          type="submit"
          disabled={pending}
          className="btn-luxury-primary relative rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed"
        >
          <span className="relative z-10">
            {pending ? "Enregistrement…" : "Enregistrer les notes"}
          </span>
        </button>
      </div>
    </form>
  );
}
