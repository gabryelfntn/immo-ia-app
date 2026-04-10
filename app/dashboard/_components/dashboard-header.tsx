"use client";

import {
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardGlobalSearch } from "./dashboard-global-search";
import { NotificationBell } from "./notification-bell";

const LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  biens: "Biens",
  contacts: "Contacts",
  annonces: "Annonces IA",
  relances: "Relances",
  visites: "Visites",
  taches: "Tâches",
  veille: "Veille biens",
  insights: "Indicateurs IA",
  compte: "Compte",
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
  onMobileMenuToggle?: () => void;
  mobileNavOpen?: boolean;
  onDesktopSidebarToggle?: () => void;
  sidebarCollapsed?: boolean;
};

export function DashboardHeader({
  agencyName,
  userName,
  onMobileMenuToggle,
  mobileNavOpen = false,
  onDesktopSidebarToggle,
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
    <header className="sticky top-0 z-40 border-b border-stone-200/90 bg-[#faf9f6]/90 px-4 py-3.5 shadow-sm shadow-stone-200/30 backdrop-blur-xl sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {onMobileMenuToggle ? (
            <button
              type="button"
              onClick={onMobileMenuToggle}
              aria-expanded={mobileNavOpen}
              aria-label={
                mobileNavOpen
                  ? "Fermer le menu de navigation"
                  : "Ouvrir le menu de navigation"
              }
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 shadow-sm transition-all duration-300 hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900 lg:hidden"
            >
              {mobileNavOpen ? (
                <X className="h-5 w-5" strokeWidth={1.65} />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={1.65} />
              )}
            </button>
          ) : null}
          {onDesktopSidebarToggle ? (
            <button
              type="button"
              onClick={onDesktopSidebarToggle}
              aria-expanded={!sidebarCollapsed}
              aria-label={
                sidebarCollapsed
                  ? "Développer le menu latéral"
                  : "Réduire le menu latéral"
              }
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 shadow-sm transition-all duration-300 hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900 lg:inline-flex"
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
                    className="h-3.5 w-3.5 shrink-0 text-stone-400"
                    aria-hidden
                  />
                ) : null}
                {c.isLast ? (
                  <span className="font-medium text-stone-900">{c.label}</span>
                ) : (
                  <Link
                    href={c.href}
                    className="font-medium text-stone-500 transition-colors duration-300 hover:text-stone-900"
                  >
                    {c.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:max-w-xl">
          <DashboardGlobalSearch />
          <div className="flex shrink-0 items-center justify-end gap-2">
            <NotificationBell />
            <div className="flex items-center gap-2.5 rounded-xl border border-stone-200 bg-white py-1 pl-1 pr-3 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-neutral-800 to-stone-900 text-xs font-bold text-white shadow-md shadow-stone-900/20">
                {initials(userName)}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-medium text-stone-800">
                  {shortName(userName)}
                </p>
                <p className="truncate text-xs text-stone-500">
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
