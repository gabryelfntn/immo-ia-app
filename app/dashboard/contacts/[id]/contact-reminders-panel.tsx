"use client";

import {
  completeContactSendReminder,
  createContactSendReminder,
} from "./reminder-actions";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Bell, Check } from "lucide-react";

export type ReminderRow = {
  id: string;
  remind_at: string;
  note: string | null;
};

type Props = {
  contactId: string;
  reminders: ReminderRow[];
};

export function ContactRemindersPanel({ contactId, reminders }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [whenLocal, setWhenLocal] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!whenLocal) {
      setErr("Choisissez une date de rappel.");
      return;
    }
    const d = new Date(whenLocal);
    if (Number.isNaN(d.getTime())) {
      setErr("Date invalide.");
      return;
    }
    startTransition(async () => {
      const res = await createContactSendReminder({
        contactId,
        remind_at: d.toISOString(),
        note: note.trim() || undefined,
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setNote("");
      setWhenLocal("");
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <Bell className="h-5 w-5 text-amber-600" />
        Rappels d&apos;envoi / relance
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Aucun e-mail n&apos;est envoyé automatiquement : c&apos;est un mémo pour
        vous. Les notifications push (si activées) peuvent résumer vos rappels
        du jour.
      </p>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500">
            Me rappeler le
          </label>
          <input
            type="datetime-local"
            value={whenLocal}
            disabled={pending}
            onChange={(e) => setWhenLocal(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-semibold text-slate-500">
            Note (optionnel)
          </label>
          <input
            value={note}
            disabled={pending}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex. Envoyer dossier + estimer"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2"
        >
          Programmer le rappel
        </button>
      </form>
      {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
      <ul className="mt-6 space-y-2">
        {reminders.length === 0 ? (
          <li className="text-sm text-slate-500">Aucun rappel en cours.</li>
        ) : (
          reminders.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(r.remind_at))}
                </p>
                {r.note ? (
                  <p className="mt-0.5 text-xs text-slate-600">{r.note}</p>
                ) : null}
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await completeContactSendReminder(r.id);
                    router.refresh();
                  })
                }
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2 py-1 text-xs font-semibold text-emerald-800"
              >
                <Check className="h-3.5 w-3.5" />
                Traité
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
