"use client";

import { Bell, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react";
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
  /** Rabattre / déplier la sidebar (optionnel, affiche un bouton sur grand écran) */
  onMenuToggle?: () => void;
  sidebarCollapsed?: boolean;
};

export function DashboardHeader({
  agencyName,
  userName,
  onMenuToggle,
  sidebarCollapsed = false,
}: Props) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = segmentLabel(seg, i);
    const isLast = i === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#08080c]/75 px-4 py-3.5 backdrop-blur-xl sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {onMenuToggle ? (
            <button
              type="button"
              onClick={onMenuToggle}
              aria-expanded={!sidebarCollapsed}
              aria-label={
                sidebarCollapsed
                  ? "Développer le menu latéral"
                  : "Réduire le menu latéral"
              }
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition-all duration-300 hover:border-violet-500/25 hover:bg-violet-500/10 hover:text-violet-200 lg:inline-flex"
            >
              {sidebarCollapsed ? (
                <ChevronsRight className="h-5 w-5" strokeWidth={1.65} />
              ) : (
                <ChevronsLeft className="h-5 w-5" strokeWidth={1.65} />
              )}
            </button>
          ) : null}
          <nav
            aria-label="Fil d'Ariane"
            className="flex min-w-0 flex-wrap items-center gap-1 text-sm"
          >
          {crumbs.map((c, i) => (
            <span key={c.href} className="flex items-center gap-1">
              {i > 0 ? (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-zinc-600"
                  aria-hidden
                />
              ) : null}
              {c.isLast ? (
                <span className="font-medium text-zinc-100">{c.label}</span>
              ) : (
                <Link
                  href={c.href}
                  className="font-medium text-zinc-500 transition-colors duration-300 hover:text-violet-300"
                >
                  {c.label}
                </Link>
              )}
            </span>
          ))}
          </nav>
        </div>

        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:max-w-xl">
          <div className="relative hidden min-w-0 flex-1 sm:block">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600"
              strokeWidth={1.65}
            />
            <input
              type="search"
              readOnly
              placeholder="Rechercher…"
              aria-label="Recherche (bientôt disponible)"
              className="w-full cursor-default rounded-xl border border-white/[0.08] bg-[#0c0c12]/80 py-2.5 pl-10 pr-4 text-sm text-zinc-300 shadow-inner shadow-black/20 placeholder:text-zinc-600 transition-colors duration-300 focus:border-violet-500/30 focus:outline-none"
            />
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2">
            <button
              type="button"
              aria-label="Notifications"
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 text-zinc-500 transition-all duration-300 hover:border-violet-500/25 hover:bg-violet-500/10 hover:text-violet-200"
            >
              <Bell className="h-5 w-5" strokeWidth={1.65} />
            </button>
            <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] py-1 pl-1 pr-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xs font-bold text-white shadow-md shadow-violet-900/40">
                {initials(userName)}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-medium text-zinc-200">
                  {shortName(userName)}
                </p>
                <p className="truncate text-xs text-zinc-600">
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
