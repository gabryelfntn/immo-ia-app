"use client";

import { Bell, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  biens: "Biens",
  contacts: "Contacts",
  annonces: "Annonces IA",
  relances: "Relances",
  visites: "Visites",
  historique: "Historique",
  new: "Nouveau",
  annonce: "Annonce IA",
};

function segmentLabel(segment: string, index: number): string {
  if (segment === "dashboard" && index === 0) return LABELS.dashboard;
  if (LABELS[segment]) return LABELS[segment];
  if (/^[0-9a-f-]{36}$/i.test(segment) || segment.length > 20) {
    return "Détail";
  }
  return segment;
}

function shortName(full: string): string {
  const p = full.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 1) return p[0] ?? full;
  return full;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

type Props = {
  agencyName: string | null;
  userName: string;
};

export function DashboardHeader({ agencyName, userName }: Props) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = segmentLabel(seg, i);
    const isLast = i === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200/90 bg-white/85 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <nav
          aria-label="Fil d'Ariane"
          className="flex min-w-0 flex-wrap items-center gap-1 text-sm"
        >
          {crumbs.map((c, i) => (
            <span key={c.href} className="flex items-center gap-1">
              {i > 0 ? (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-gray-400"
                  aria-hidden
                />
              ) : null}
              {c.isLast ? (
                <span className="font-semibold text-gray-900">{c.label}</span>
              ) : (
                <Link
                  href={c.href}
                  className="font-medium text-gray-500 transition-colors hover:text-violet-600"
                >
                  {c.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:max-w-2xl">
          <div className="relative hidden min-w-0 flex-1 sm:block">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              strokeWidth={1.75}
            />
            <input
              type="search"
              readOnly
              placeholder="Rechercher…"
              aria-label="Recherche (bientôt disponible)"
              className="w-full cursor-default rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-600 shadow-sm placeholder:text-gray-400"
            />
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2">
            <button
              type="button"
              aria-label="Notifications"
              className="rounded-2xl border border-gray-200 bg-white p-2.5 text-gray-500 shadow-sm transition-colors hover:border-violet-200 hover:bg-violet-50/50 hover:text-violet-600"
            >
              <Bell className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <div className="flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white py-1 pl-1 pr-3 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white">
                {initials(userName)}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {shortName(userName)}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {agencyName ?? "Agence"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
