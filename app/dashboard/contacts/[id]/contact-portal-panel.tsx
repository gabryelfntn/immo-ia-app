"use client";

import { Check, Copy, Link2, RefreshCw } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import {
  createClientPortalLink,
  syncClientPortalProposals,
} from "../portal-actions";

type Props = { contactId: string };

export function ContactPortalPanel({ contactId }: Props) {
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onCreateLink = useCallback(() => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const r = await createClientPortalLink(contactId);
      if (!r.ok) {
        setError(r.error);
        setUrl(null);
        setExpiresAt(null);
        return;
      }
      setUrl(r.url);
      setExpiresAt(r.expiresAt);
      setMessage("Nouveau lien créé. Copiez-le et transmettez-le au client.");
    });
  }, [contactId]);

  const onSync = useCallback(() => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const r = await syncClientPortalProposals(contactId);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setMessage("Biens proposés sur le portail mis à jour.");
    });
  }, [contactId]);

  const onCopy = useCallback(async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Impossible de copier le lien.");
    }
  }, [url]);

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-6 card-luxury">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Espace client</h2>
          <p className="mt-1 text-sm text-slate-500">
            Lien sécurisé : le client voit l’avancement, les biens que vous
            publiez et ses comptes-rendus de visite.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={onCreateLink}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-100 disabled:opacity-50"
          >
            <Link2 className="h-4 w-4" />
            Générer un lien
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onSync}
            className="btn-luxury-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <RefreshCw className="relative z-10 h-4 w-4" />
            <span className="relative z-10">Publier les biens (matching)</span>
          </button>
        </div>
      </div>

      {message ? (
        <p className="mt-4 rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-lg border border-red-200/80 bg-red-50/80 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {url ? (
        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-stone-200 bg-[#faf9f6] p-4 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 break-all text-xs text-stone-800">
            {url}
          </code>
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
      ) : null}
      {expiresAt ? (
        <p className="mt-2 text-xs text-stone-500">
          Expire le{" "}
          {new Intl.DateTimeFormat("fr-FR", {
            dateStyle: "long",
            timeStyle: "short",
          }).format(new Date(expiresAt))}
        </p>
      ) : null}
    </div>
  );
}
