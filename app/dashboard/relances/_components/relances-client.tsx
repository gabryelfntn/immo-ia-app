"use client";

import { Bell, Sparkles, Check, Clock } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { FollowupModal } from "./followup-modal";
import { RelancesSubnav } from "./relances-subnav";

export type InactiveContact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  lastActivityISO: string;
  daysInactive: number;
};

type EmailPayload = { subject: string; body: string; tone: string };
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
  contacts: InactiveContact[];
  filterDays: 7 | 14 | 30;
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "client":
      return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/25";
    case "chaud":
      return "bg-red-500/15 text-red-200 ring-1 ring-red-400/30";
    case "tiede":
      return "bg-orange-500/15 text-orange-200 ring-1 ring-orange-400/30";
    case "froid":
      return "bg-zinc-500/15 text-zinc-200 ring-1 ring-zinc-400/25";
    default:
      return "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-400/20";
  }
}

function inactivityGlow(days: number): string {
  if (days >= 30) return "shadow-[0_0_28px_-14px_rgba(239,68,68,0.35)]";
  if (days >= 14) return "shadow-[0_0_22px_-14px_rgba(245,158,11,0.25)]";
  return "shadow-[0_0_18px_-14px_rgba(99,102,241,0.18)]";
}

export function RelancesClient({ contacts, filterDays }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContact, setModalContact] = useState<InactiveContact | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [email, setEmail] = useState<EmailPayload | null>(null);
  const [suggested, setSuggested] = useState<SuggestedProperty[]>([]);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const list = useMemo(() => contacts, [contacts]);

  const openModalFor = useCallback(async (c: InactiveContact) => {
    setModalContact(c);
    setModalOpen(true);
    setEmail(null);
    setSuggested([]);
    setEmailError(null);
    setLoadingEmail(true);
    try {
      const res = await fetch("/api/generate-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: c.id }),
      });
      const data = (await res.json()) as {
        error?: string;
        email?: EmailPayload;
        suggestedProperties?: SuggestedProperty[];
      };
      if (!res.ok) {
        setEmailError(data.error ?? `Erreur ${res.status}`);
        return;
      }
      setEmail(data.email ?? null);
      setSuggested(data.suggestedProperties ?? []);
    } catch {
      setEmailError("Réseau indisponible ou réponse invalide.");
    } finally {
      setLoadingEmail(false);
    }
  }, []);

  const markContacted = useCallback(async (contactId: string) => {
    setMarkingId(contactId);
    try {
      const res = await fetch("/api/mark-contacted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
      window.location.reload();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Action impossible.";
      window.alert(msg);
    } finally {
      setMarkingId(null);
    }
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500/90">
            CRM
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
            Relances
          </h1>
          <p className="mt-2 text-zinc-500">
            {list.length} contact{list.length !== 1 ? "s" : ""} inactif
            {list.length !== 1 ? "s" : ""} depuis ≥ {filterDays} jours
          </p>
        </div>
      </div>

      <RelancesSubnav current="liste" />

      <form
        action="/dashboard/relances"
        method="get"
        className="mt-6 flex flex-wrap items-center gap-3"
      >
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#12121a]/80 p-2 backdrop-blur-sm">
          <select
            name="days"
            defaultValue={String(filterDays)}
            className="rounded-full border border-white/10 bg-[#0a0a0f] px-4 py-2 text-sm font-medium text-zinc-200 outline-none transition-all duration-300 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="7">Inactifs depuis 7 jours</option>
            <option value="14">Inactifs depuis 14 jours</option>
            <option value="30">Inactifs depuis 30 jours</option>
          </select>
          <button
            type="submit"
            className="rounded-full bg-amber-500/15 px-5 py-2 text-sm font-semibold text-amber-200 transition-all duration-300 hover:bg-amber-500/25"
          >
            Appliquer
          </button>
        </div>
      </form>

      {list.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#12121a]/50 px-8 py-20 text-center">
          <Bell className="mb-4 h-12 w-12 text-zinc-600" />
          <p className="text-xl font-semibold text-zinc-200">
            Aucun contact inactif
          </p>
          <p className="mt-2 max-w-md text-sm text-zinc-500">
            Essayez un autre seuil (14 ou 30 jours) ou attendez de nouvelles
            entrées.
          </p>
        </div>
      ) : (
        <ul className="mt-10 flex flex-col gap-4">
          {list.map((c) => {
            const name = `${c.first_name} ${c.last_name}`.trim();
            const loadingMark = markingId === c.id;
            return (
              <li key={c.id}>
                <article
                  className={`card-luxury rounded-2xl border border-white/[0.08] bg-[#12121a] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-500/20 sm:p-6 ${inactivityGlow(
                    c.daysInactive
                  )}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-bold text-white">
                          {name}
                        </h2>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                            c.status
                          )}`}
                        >
                          {c.status}
                        </span>
                        <span className="inline-flex items-center gap-2 text-sm text-zinc-500">
                          <Clock className="h-4 w-4 text-indigo-400/80" />
                          {c.daysInactive} jour
                          {c.daysInactive !== 1 ? "s" : ""} sans contact
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-indigo-200/90">
                        {c.email}
                      </p>
                      <p className="mt-3 text-sm text-zinc-500">
                        Dernière activité :{" "}
                        <span className="text-zinc-300">
                          {formatDate(c.lastActivityISO)}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => openModalFor(c)}
                        className="btn-luxury-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all duration-300"
                      >
                        <Sparkles className="relative z-10 h-4 w-4" />
                        <span className="relative z-10">
                          Générer une relance IA
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={loadingMark}
                        onClick={() => markContacted(c.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-200 shadow-[0_0_24px_-10px_rgba(52,211,153,0.25)] transition-all hover:border-emerald-400/45 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {loadingMark ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-300" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Marquer comme contacté
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      <FollowupModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        contactName={
          modalContact
            ? `${modalContact.first_name} ${modalContact.last_name}`.trim()
            : ""
        }
        contactEmail={modalContact?.email ?? ""}
        email={email}
        suggestedProperties={suggested}
        loading={loadingEmail}
        error={emailError}
        onMarkContacted={async () => {
          if (modalContact) await markContacted(modalContact.id);
        }}
      />
    </div>
  );
}

