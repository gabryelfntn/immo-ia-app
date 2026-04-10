"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Item = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
  kind: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const j = (await res.json()) as {
        items?: Item[];
        unread?: number;
        error?: string;
      };
      if (res.ok && j.items) {
        setItems(j.items);
        setUnread(j.unread ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markAllRead = useCallback(async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setUnread(0);
    setItems((prev) =>
      prev.map((i) => ({
        ...i,
        read_at: i.read_at ?? new Date().toISOString(),
      }))
    );
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Notifications${unread > 0 ? `, ${unread} non lues` : ""}`}
        className="relative rounded-xl border border-stone-200 bg-white p-2.5 text-stone-500 shadow-sm transition-all duration-300 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-900"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="h-5 w-5" strokeWidth={1.65} aria-hidden />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Centre de notifications"
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-stone-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-stone-100 px-3 py-2">
            <span className="text-xs font-semibold text-stone-600">
              Notifications
            </span>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-[11px] font-medium text-amber-800 hover:underline"
              >
                Tout marquer lu
              </button>
            ) : null}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-3 py-4 text-sm text-stone-500">Chargement…</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-4 text-sm text-stone-500">
                Aucune notification récente.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {items.map((it) => (
                  <li key={it.id} className="px-3 py-2.5">
                    {it.link ? (
                      <Link
                        href={it.link}
                        className="block text-sm font-medium text-stone-900 hover:underline"
                        onClick={() => setOpen(false)}
                      >
                        {it.title}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-stone-900">
                        {it.title}
                      </p>
                    )}
                    {it.body ? (
                      <p className="mt-0.5 text-xs text-stone-600">{it.body}</p>
                    ) : null}
                    <p className="mt-1 text-[10px] text-stone-400">
                      {new Date(it.created_at).toLocaleString("fr-FR")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-stone-100 px-3 py-2">
            <Link
              href="/dashboard/compte"
              className="text-xs font-medium text-amber-800 hover:underline"
              onClick={() => setOpen(false)}
            >
              Préférences notifications →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
