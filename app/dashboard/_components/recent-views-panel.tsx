"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "immo-recent-views";

type Item = {
  kind: "contact" | "property";
  id: string;
  title: string;
  href: string;
  at: number;
};

export function RecentViewsPanel() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Item[];
      if (Array.isArray(parsed)) setItems(parsed.slice(0, 8));
    } catch {
      /* ignore */
    }
  }, []);

  if (!items.length) return null;

  return (
    <section className="card-luxury p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <Clock className="h-5 w-5 text-stone-600" strokeWidth={1.75} />
        Fiches récentes (ce navigateur)
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Derniers contacts et biens consultés sur cet appareil.
      </p>
      <ul className="mt-4 space-y-2">
        {items.map((x) => (
          <li key={`${x.kind}-${x.id}`}>
            <Link
              href={x.href}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2 text-sm transition hover:border-stone-300 hover:bg-stone-100"
            >
              <span className="min-w-0 truncate font-medium text-slate-900">
                {x.title}
              </span>
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {x.kind === "contact" ? "Contact" : "Bien"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
