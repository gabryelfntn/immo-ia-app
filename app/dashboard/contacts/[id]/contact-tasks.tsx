"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  completeAgencyTask,
  createAgencyTask,
  deleteAgencyTask,
} from "@/app/dashboard/taches/actions";
import { Trash2 } from "lucide-react";

export type ContactTaskRow = {
  id: string;
  title: string;
  due_at: string;
  completed_at: string | null;
  notes: string | null;
};

type Props = {
  contactId: string;
  tasks: ContactTaskRow[];
};

export function ContactTasksPanel({ contactId, tasks }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [dueLocal, setDueLocal] = useState("");

  const openTasks = tasks.filter((t) => !t.completed_at);
  const doneTasks = tasks.filter((t) => t.completed_at);

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !dueLocal) {
      setError("Titre et date d’échéance requis.");
      return;
    }
    const due = new Date(dueLocal);
    if (Number.isNaN(due.getTime())) {
      setError("Date invalide.");
      return;
    }
    startTransition(async () => {
      const result = await createAgencyTask({
        title: title.trim(),
        due_at: due.toISOString(),
        contact_id: contactId,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTitle("");
      setDueLocal("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
      <h2 className="text-lg font-bold text-slate-900">Tâches & rappels</h2>
      <p className="mt-1 text-sm text-slate-500">
        Actions à mener pour ce contact (visite, rappel téléphonique, envoi de
        dossier…).
      </p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="task-title"
              className="text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Titre
            </label>
            <input
              id="task-title"
              value={title}
              disabled={pending}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Relancer après visite"
              className="rounded-xl border border-slate-200/90 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-500/40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="task-due"
              className="text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Échéance
            </label>
            <input
              id="task-due"
              type="datetime-local"
              value={dueLocal}
              disabled={pending}
              onChange={(e) => setDueLocal(e.target.value)}
              className="rounded-xl border border-slate-200/90 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-500/40"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-violet-600/90 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
        >
          Ajouter la tâche
        </button>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </form>

      <ul className="mt-8 space-y-2">
        {openTasks.length === 0 ? (
          <li className="text-sm text-slate-500">Aucune tâche ouverte.</li>
        ) : (
          openTasks.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white/[0.03] px-4 py-3"
            >
              <div>
                <p className="font-medium text-slate-800">{t.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(t.due_at))}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await completeAgencyTask(t.id);
                      router.refresh();
                    })
                  }
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  Fait
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteAgencyTask(t.id);
                      router.refresh();
                    })
                  }
                  className="rounded-lg border border-slate-200/90 p-1.5 text-slate-500 transition-colors hover:border-rose-500/30 hover:text-rose-300 disabled:opacity-50"
                  aria-label="Supprimer la tâche"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      {doneTasks.length > 0 ? (
        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Récemment terminées
          </p>
          <ul className="mt-2 space-y-1 text-sm text-slate-500">
            {doneTasks.slice(0, 5).map((t) => (
              <li key={t.id} className="line-through">
                {t.title}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
