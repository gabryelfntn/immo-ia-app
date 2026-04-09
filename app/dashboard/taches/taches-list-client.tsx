"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { completeAgencyTask, deleteAgencyTask } from "./actions";
import { Check, Trash2 } from "lucide-react";

type TaskRow = {
  id: string;
  title: string;
  due_at: string;
  completed_at: string | null;
  contact_id: string | null;
};

type Props = {
  tasks: TaskRow[];
  contactNames: Record<string, string>;
};

export function TachesListClient({ tasks, contactNames }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const open = tasks.filter((t) => !t.completed_at);
  const done = tasks.filter((t) => t.completed_at);

  const now = Date.now();
  const sod = new Date();
  sod.setHours(0, 0, 0, 0);
  const sodMs = sod.getTime();

  function rowAccent(iso: string, completed: boolean): string {
    if (completed) return "border-white/[0.06] bg-white/[0.02]";
    const t = new Date(iso).getTime();
    if (t < sodMs) return "border-rose-500/25 bg-rose-500/5";
    if (t < now + 86_400_000) return "border-amber-500/25 bg-amber-500/5";
    return "border-white/[0.06] bg-white/[0.03]";
  }

  return (
    <div className="mt-10 space-y-10">
      <section>
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-zinc-500">
          À faire ({open.length})
        </h2>
        {open.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-white/[0.08] px-6 py-12 text-center text-sm text-zinc-500">
            Aucune tâche ouverte. Créez-en depuis une fiche contact.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {open.map((t) => (
              <li
                key={t.id}
                className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-5 py-4 ${rowAccent(t.due_at, false)}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-100">{t.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(t.due_at))}
                  </p>
                  {t.contact_id && contactNames[t.contact_id] ? (
                    <Link
                      href={`/dashboard/contacts/${t.contact_id}`}
                      className="mt-2 inline-block text-sm font-medium text-violet-400 hover:text-violet-300"
                    >
                      {contactNames[t.contact_id]}
                    </Link>
                  ) : null}
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
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    Terminer
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
                    className="rounded-xl border border-white/[0.08] p-2 text-zinc-500 hover:border-rose-500/30 hover:text-rose-300 disabled:opacity-50"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 ? (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-zinc-600">
            Terminées (récentes)
          </h2>
          <ul className="mt-4 space-y-2">
            {done
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.completed_at!).getTime() -
                  new Date(a.completed_at!).getTime()
              )
              .slice(0, 30)
              .map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.04] px-4 py-2 text-sm text-zinc-500 line-through"
                >
                  <span>{t.title}</span>
                  <span className="text-xs">
                    {t.completed_at
                      ? new Intl.DateTimeFormat("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(t.completed_at))
                      : ""}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
