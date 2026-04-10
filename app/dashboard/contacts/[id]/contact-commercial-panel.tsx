"use client";

import {
  markContactCoordinatesVerified,
  updateContactCommercialMeta,
} from "@/app/dashboard/contacts/actions";
import { CONTACT_SOURCE_PRESETS } from "@/lib/contacts/source-presets";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  contactId: string;
  initialSource: string | null;
  initialNextLabel: string | null;
  initialNextAt: string | null;
  initialVerifiedAt: string | null;
};

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ContactCommercialPanel({
  contactId,
  initialSource,
  initialNextLabel,
  initialNextAt,
  initialVerifiedAt,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [source, setSource] = useState(initialSource ?? "");
  const [nextLabel, setNextLabel] = useState(initialNextLabel ?? "");
  const [nextAt, setNextAt] = useState(toDatetimeLocalValue(initialNextAt));

  const saveMeta = () => {
    setErr(null);
    startTransition(async () => {
      const iso =
        nextAt.trim() === ""
          ? null
          : new Date(nextAt).toISOString();
      if (nextAt.trim() !== "" && Number.isNaN(new Date(nextAt).getTime())) {
        setErr("Date invalide.");
        return;
      }
      const res = await updateContactCommercialMeta(contactId, {
        source: source.trim() || null,
        next_action_label: nextLabel.trim() || null,
        next_action_at: iso,
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      router.refresh();
    });
  };

  const markVerified = () => {
    setErr(null);
    startTransition(async () => {
      const res = await markContactCoordinatesVerified(contactId);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
        Suivi commercial
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Source du lead, prochaine action, vérification des coordonnées.
      </p>
      <div className="mt-4 space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-500">
            Source
          </label>
          <input
            list="contact-source-presets"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Ex. Leboncoin, site web…"
          />
          <datalist id="contact-source-presets">
            {CONTACT_SOURCE_PRESETS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500">
            Prochaine action (libellé)
          </label>
          <input
            value={nextLabel}
            onChange={(e) => setNextLabel(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Ex. Rappeler pour visite samedi"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500">
            Échéance
          </label>
          <input
            type="datetime-local"
            value={nextAt}
            onChange={(e) => setNextAt(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => saveMeta()}
            className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Enregistrer
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => markVerified()}
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 disabled:opacity-50"
          >
            Coordonnées vérifiées
          </button>
        </div>
        {initialVerifiedAt ? (
          <p className="text-xs text-slate-500">
            Dernière vérif. coordonnées :{" "}
            {new Intl.DateTimeFormat("fr-FR", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(initialVerifiedAt))}
          </p>
        ) : null}
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
      </div>
    </section>
  );
}
