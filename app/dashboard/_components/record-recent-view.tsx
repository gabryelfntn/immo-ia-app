"use client";

import { useEffect } from "react";

const STORAGE_KEY = "immo-recent-views";

export type RecentViewKind = "contact" | "property";

export function RecordRecentView(props: {
  kind: RecentViewKind;
  id: string;
  title: string;
  href: string;
}) {
  useEffect(() => {
    try {
      const item = {
        kind: props.kind,
        id: props.id,
        title: props.title,
        href: props.href,
        at: Date.now(),
      };
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? (JSON.parse(raw) as typeof item[]) : [];
      const filtered = list.filter(
        (x) => !(x.kind === item.kind && x.id === item.id)
      );
      const next = [item, ...filtered].slice(0, 10);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [props.kind, props.id, props.title, props.href]);

  return null;
}
