"use client";

import {
  Building2,
  Bell,
  Calendar,
  CalendarClock,
  ChevronsLeft,
  ChevronsRight,
  Home,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Sparkles,
  UserRoundCog,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "../actions";

const baseNav = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/journee", label: "Ma journée", icon: CalendarClock },
  { href: "/dashboard/biens", label: "Biens", icon: Building2 },
  { href: "/dashboard/contacts", label: "Contacts", icon: Users },
  { href: "/dashboard/relances", label: "Relances", icon: Bell },
  { href: "/dashboard/visites", label: "Visites", icon: Calendar },
  { href: "/dashboard/taches", label: "Tâches", icon: ListTodo },
  { href: "/dashboard/annonces", label: "Annonces IA", icon: Sparkles },
] as const;

const teamNavItem = {
  href: "/dashboard/equipe",
  label: "Équipe",
  icon: UserRoundCog,
} as const;

type Props = {
  userName: string;
  agencyName: string | null;
  roleLabel: string;
  showTeamNav?: boolean;
  narrowDesktop: boolean;
  mobileDrawerOpen: boolean;
  isDesktopLayout: boolean;
  onToggleSidebar: () => void;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

export function DashboardSidebar({
  userName,
  agencyName,
  roleLabel,
  showTeamNav = false,
  narrowDesktop,
  mobileDrawerOpen,
  isDesktopLayout,
  onToggleSidebar,
}: Props) {
  const pathname = usePathname();
  const collapsed = narrowDesktop && isDesktopLayout;
  const nav = showTeamNav
    ? [...baseNav.slice(0, 2), teamNavItem, ...baseNav.slice(2)]
    : [...baseNav];

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-[100dvh] max-h-[100dvh] w-[272px] flex-col overflow-hidden border-r border-stone-200/90 bg-[#faf8f4] shadow-[4px_0_32px_-12px_rgba(28,25,23,0.06)] backdrop-blur-xl transition-[width,transform] duration-300 ease-out motion-reduce:transition-none lg:inset-y-0 lg:h-auto lg:max-h-none ${
        narrowDesktop ? "lg:w-[76px]" : ""
      } ${
        mobileDrawerOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
      } lg:translate-x-0`}
    >
      <div
        className={`flex shrink-0 items-center gap-2 border-b border-stone-200/80 py-5 ${
          collapsed ? "flex-col px-2" : "justify-between px-4"
        }`}
      >
        <Link
          href="/dashboard"
          title="ImmoAI — Accueil"
          className={`group flex min-w-0 items-center gap-3 outline-none transition-opacity duration-300 hover:opacity-90 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-800 to-stone-900 text-white shadow-md shadow-stone-900/25 ring-1 ring-stone-900/15 transition-transform duration-300 group-hover:scale-[1.02]">
            <Home className="h-[22px] w-[22px]" strokeWidth={1.65} />
          </span>
          {!collapsed ? (
            <div className="min-w-0">
              <span className="block truncate text-[17px] font-bold tracking-tight text-stone-900">
                ImmoAI
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                Suite agence
              </span>
            </div>
          ) : null}
        </Link>
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-expanded={isDesktopLayout ? !collapsed : mobileDrawerOpen}
          aria-label={
            isDesktopLayout
              ? collapsed
                ? "Développer le menu latéral"
                : "Réduire le menu latéral"
              : "Fermer le menu de navigation"
          }
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition-colors duration-300 hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900"
        >
          {isDesktopLayout ? (
            collapsed ? (
              <ChevronsRight className="h-5 w-5" strokeWidth={1.65} />
            ) : (
              <ChevronsLeft className="h-5 w-5" strokeWidth={1.65} />
            )
          ) : (
            <X className="h-5 w-5" strokeWidth={1.65} />
          )}
        </button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden overscroll-y-contain px-2 py-4">
        {!collapsed ? (
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
            Navigation
          </p>
        ) : null}
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`group relative flex items-center rounded-xl py-2.5 text-[13px] font-medium transition-all duration-300 ${
                collapsed ? "justify-center px-2" : "gap-3 px-3"
              } ${
                active
                  ? "bg-stone-200/90 text-stone-900 shadow-sm ring-1 ring-stone-300/80"
                  : "text-stone-600 hover:bg-stone-100/90 hover:text-stone-900"
              }`}
            >
              {active && !collapsed ? (
                <span
                  className="absolute left-0 top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-full bg-stone-900 shadow-sm"
                  aria-hidden
                />
              ) : null}
              {active && collapsed ? (
                <span
                  className="absolute inset-x-1 inset-y-1 rounded-lg bg-stone-200/90 ring-1 ring-stone-300"
                  aria-hidden
                />
              ) : null}
              <Icon
                className={`nav-icon-glow relative z-[1] h-[18px] w-[18px] shrink-0 transition-colors duration-300 ${
                  active ? "text-stone-900" : "text-stone-500"
                }`}
                strokeWidth={1.65}
              />
              {!collapsed ? (
                <span className="relative z-[1]">{item.label}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="mx-3 mb-3 shrink-0 rounded-xl border border-stone-200/90 bg-gradient-to-br from-stone-100/90 to-[#f0ebe3] p-4 shadow-sm">
          <p className="text-xs font-semibold text-stone-800">Automatisation</p>
          <p className="mt-1 text-[11px] leading-relaxed text-stone-600">
            Relances IA, visites et matching.
          </p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-stone-300/80">
            <div
              className="h-full w-[55%] rounded-full bg-gradient-to-r from-stone-700 to-neutral-900 transition-all duration-700"
              aria-hidden
            />
          </div>
        </div>
      ) : (
        <div className="mx-2 mb-2 flex shrink-0 justify-center rounded-lg border border-stone-200 bg-stone-100/90 p-2">
          <Sparkles
            className="h-4 w-4 text-stone-700"
            strokeWidth={1.65}
            aria-hidden
          />
        </div>
      )}

      <div className="mt-auto shrink-0 border-t border-stone-200/80 px-2 py-2">
        <form action={signOut}>
          <button
            type="submit"
            title="Déconnexion"
            className={`flex w-full items-center rounded-xl py-2.5 text-[13px] font-medium text-stone-500 transition-all duration-300 hover:bg-stone-100 hover:text-stone-800 ${
              collapsed ? "justify-center px-2" : "gap-3 px-3 text-left"
            }`}
          >
            <LogOut className="h-[17px] w-[17px] shrink-0 opacity-80" />
            {!collapsed ? "Déconnexion" : null}
          </button>
        </form>
      </div>

      <div className="shrink-0 border-t border-stone-200/80 px-2 py-4">
        <div
          className={`flex items-center gap-3 ${collapsed ? "justify-center" : "px-2"}`}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-200 text-xs font-bold text-stone-800 ring-1 ring-stone-300/80"
            title={`${userName} · ${roleLabel}`}
          >
            {initials(userName)}
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-stone-800">
                {userName}
              </p>
              {agencyName ? (
                <p className="truncate text-xs text-stone-500">{agencyName}</p>
              ) : (
                <p className="truncate text-xs text-stone-500">Agence</p>
              )}
              <p className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-wide text-stone-400">
                {roleLabel}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
