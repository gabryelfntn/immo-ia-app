"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteContact } from "../actions";

export function ContactGdprPanel({
  contactId,
  canDelete,
}: {
  contactId: string;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onDelete() {
    if (
      !confirm(
        "Supprimer définitivement ce contact et les données liées (selon contraintes base) ?"
      )
    ) {
      return;
    }
    setBusy(true);
    setMsg(null);
    const r = await deleteContact(contactId);
    setBusy(false);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    router.push("/dashboard/contacts");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-red-200/80 bg-red-50/40 p-6">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-red-900/90">
        Données personnelles (RGPD)
      </h2>
      <p className="mt-2 text-sm text-slate-700">
        Export JSON à des fins de portabilité / dossier. La suppression est
        irréversible côté application ; vérifie tes obligations légales et
        mandats en cours.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={`/api/gdpr/export-contact/${contactId}`}
          className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900"
        >
          Télécharger export JSON
        </a>
        {canDelete ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onDelete()}
            className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-800 disabled:opacity-50"
          >
            {busy ? "…" : "Supprimer le contact"}
          </button>
        ) : (
          <p className="text-sm text-slate-600">
            Suppression réservée au responsable du contact ou au manager.
          </p>
        )}
      </div>
      {msg ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
