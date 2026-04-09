"use client";

import { Building2, Loader2, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  CONTACT_TYPE_LABELS,
} from "@/lib/contacts/labels";
import type { ContactType } from "@/lib/contacts/schema";
import { PROPERTY_STATUS_LABELS } from "@/lib/properties/labels";
import type { PropertyStatus } from "@/lib/properties/schema";

type PropertyHit = {
  id: string;
  title: string;
  city: string;
  status: string;
};

type ContactHit = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  type: string;
};

const DEBOUNCE_MS = 280;

export function DashboardGlobalSearch() {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<PropertyHit[]>([]);
  const [contacts, setContacts] = useState<ContactHit[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (debounced.length < 2) {
      setProperties([]);
      setContacts([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const run = async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(debounced)}`,
          { credentials: "same-origin" }
        );
        const json = (await res.json()) as {
          properties?: PropertyHit[];
          contacts?: ContactHit[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error ?? "Recherche impossible.");
          setProperties([]);
          setContacts([]);
          return;
        }
        setProperties(json.properties ?? []);
        setContacts(json.contacts ?? []);
      } catch {
        if (!cancelled) {
          setError("Erreur réseau.");
          setProperties([]);
          setContacts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const onPick = useCallback(() => {
    setOpen(false);
    setQ("");
    setDebounced("");
    setProperties([]);
    setContacts([]);
  }, []);

  const showPanel =
    open && (debounced.length >= 2 || loading || Boolean(error));
  const total = properties.length + contacts.length;
  const emptyReady =
    debounced.length >= 2 && !loading && !error && total === 0;

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
        strokeWidth={1.65}
        aria-hidden
      />
      <input
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
          }
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
        placeholder="Rechercher un bien, un contact…"
        aria-label="Recherche globale"
        aria-expanded={showPanel}
        aria-controls={showPanel ? listId : undefined}
        aria-autocomplete="list"
        className="w-full rounded-xl border border-stone-200/90 bg-[#f5f3ef] py-2.5 pl-10 pr-4 text-sm text-stone-800 shadow-inner shadow-stone-200/40 placeholder:text-stone-400 transition-colors duration-300 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
      />

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[min(70vh,22rem)] overflow-auto rounded-xl border border-stone-200/90 bg-white py-2 shadow-lg shadow-stone-900/10"
        >
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-6 text-sm text-stone-500">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              Recherche…
            </div>
          ) : null}

          {error ? (
            <p className="px-4 py-3 text-sm text-red-600">{error}</p>
          ) : null}

          {emptyReady ? (
            <p className="px-4 py-6 text-center text-sm text-stone-500">
              Aucun résultat pour « {debounced} »
            </p>
          ) : null}

          {!loading && !error && properties.length > 0 ? (
            <div className="px-2">
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400">
                Biens
              </p>
              <ul className="space-y-0.5">
                {properties.map((p) => {
                  const statusLabel =
                    p.status in PROPERTY_STATUS_LABELS
                      ? PROPERTY_STATUS_LABELS[p.status as PropertyStatus]
                      : p.status;
                  return (
                    <li key={p.id} role="option">
                      <Link
                        href={`/dashboard/biens/${p.id}`}
                        onClick={onPick}
                        className="flex items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-stone-100"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
                          <Building2 className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-stone-900">
                            {p.title}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-stone-500">
                            {p.city} · {statusLabel}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {!loading && !error && contacts.length > 0 ? (
            <div
              className={`px-2 ${properties.length > 0 ? "mt-2 border-t border-stone-100 pt-2" : ""}`}
            >
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400">
                Contacts
              </p>
              <ul className="space-y-0.5">
                {contacts.map((c) => {
                  const name = `${c.first_name} ${c.last_name}`.trim();
                  const typeLabel =
                    CONTACT_TYPE_LABELS[c.type as ContactType] ?? c.type;
                  return (
                    <li key={c.id} role="option">
                      <Link
                        href={`/dashboard/contacts/${c.id}`}
                        onClick={onPick}
                        className="flex items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-stone-100"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
                          <UserRound className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-stone-900">
                            {name}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-stone-500">
                            {c.email} · {typeLabel}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
