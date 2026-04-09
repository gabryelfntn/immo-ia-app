"use client";

import { X, Copy, Check, Mail, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type EmailPayload = {
  subject: string;
  body: string;
  tone: string;
};

type SuggestedProperty = {
  id: string;
  title: string;
  transaction: "vente" | "location";
  type: string;
  price: number;
  surface: number;
  city: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  contactName: string;
  contactEmail: string;
  email: EmailPayload | null;
  suggestedProperties: SuggestedProperty[];
  loading: boolean;
  error: string | null;
  onMarkContacted: () => Promise<void>;
};

export function FollowupModal(props: Props) {
  const {
    open,
    onClose,
    contactName,
    contactEmail,
    email,
    suggestedProperties,
    loading,
    error,
    onMarkContacted,
  } = props;

  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setSaving(false);
    }
  }, [open]);

  const contentToCopy = useMemo(() => {
    if (!email) return "";
    return `Objet : ${email.subject}\n\n${email.body}`.trim();
  }, [email]);

  const onCopy = useCallback(async () => {
    if (!contentToCopy) return;
    try {
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // fallback
      try {
        const ta = document.createElement("textarea");
        ta.value = contentToCopy;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      } catch {
        /* ignore */
      }
    }
  }, [contentToCopy]);

  const onMark = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onMarkContacted();
      onClose();
    } finally {
      setSaving(false);
    }
  }, [onMarkContacted, onClose, saving]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-10 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Email de relance"
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white via-gray-50 to-slate-100 shadow-[0_0_80px_-30px_rgba(99,102,241,0.35)]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500/90">
              Relance IA
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-zinc-200">
              {contactName} ·{" "}
              <span className="font-medium text-zinc-500">{contactEmail}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/[0.08] bg-[#0c0c10] p-2 text-zinc-400 transition-colors hover:border-white/12 hover:text-zinc-200"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6 sm:px-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-black/20 py-16">
              <span
                className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-400"
                aria-hidden
              />
              <p className="mt-4 text-sm font-medium text-zinc-400">
                Claude rédige votre email de relance…
              </p>
            </div>
          ) : error ? (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : !email ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-6 py-14 text-center">
              <Sparkles className="mb-4 h-10 w-10 text-indigo-500/40" />
              <p className="text-sm font-medium text-zinc-500">
                Aucun email généré pour l’instant.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Sujet
                    </p>
                    <p className="mt-2 text-sm font-semibold text-zinc-50">
                      {email.subject}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-violet-700">
                    <Mail className="h-4 w-4" />
                    Ton: {email.tone}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Corps de l’email
                </p>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                  {email.body}
                </div>
              </div>

              {suggestedProperties.length > 0 ? (
                <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Biens suggérés (contexte)
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                    {suggestedProperties.map((p) => (
                      <li key={p.id} className="flex flex-wrap gap-x-2">
                        <span className="font-semibold text-zinc-200">
                          {p.title}
                        </span>
                        <span className="text-zinc-600">·</span>
                        <span>{p.city}</span>
                        <span className="text-zinc-600">·</span>
                        <span>
                          {p.surface} m² · {p.transaction}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/[0.06] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <button
            type="button"
            onClick={onCopy}
            disabled={!email || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#0c0c10] px-5 py-3 text-sm font-semibold text-zinc-200 transition-all hover:border-white/12 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-300" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copié" : "Copier l'email"}
          </button>

          <button
            type="button"
            onClick={onMark}
            disabled={loading || saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-200 shadow-[0_0_24px_-10px_rgba(52,211,153,0.25)] transition-all hover:border-emerald-400/45 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-300" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Marquer comme contacté
          </button>
        </div>
      </div>
    </div>
  );
}

