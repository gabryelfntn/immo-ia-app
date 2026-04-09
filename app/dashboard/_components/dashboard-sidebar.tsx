"use client";

import {
  Building2,
  Bell,
  Calendar,
  ChevronsLeft,
  ChevronsRight,
  Home,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "../actions";

const nav = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/biens", label: "Biens", icon: Building2 },
  { href: "/dashboard/contacts", label: "Contacts", icon: Users },
  { href: "/dashboard/relances", label: "Relances", icon: Bell },
  { href: "/dashboard/visites", label: "Visites", icon: Calendar },
  { href: "/dashboard/annonces", label: "Annonces IA", icon: Sparkles },
] as const;

type Props = {
  userName: string;
  agencyName: string | null;
  /** Mode étroit (icônes) uniquement sur grand écran */
  narrowDesktop: boolean;
  /** Tiroir mobile ouvert */
  mobileDrawerOpen: boolean;
  /** Viewport ≥ lg — sinon le menu est un tiroir */
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
  narrowDesktop,
  mobileDrawerOpen,
  isDesktopLayout,
  onToggleSidebar,
}: Props) {
  const pathname = usePathname();
  const collapsed = narrowDesktop && isDesktopLayout;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.06] bg-app-sidebar/95 shadow-[4px_0_48px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-[width,transform] duration-300 ease-out motion-reduce:transition-none ${
        narrowDesktop ? "w-[272px] lg:w-[76px]" : "w-[272px]"
      } ${
        mobileDrawerOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
      } lg:translate-x-0`}
    >
      <div
        className={`flex shrink-0 items-center gap-2 border-b border-white/[0.06] py-5 ${
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
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-900/50 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-[1.02]">
            <Home className="h-[22px] w-[22px]" strokeWidth={1.65} />
          </span>
          {!collapsed ? (
            <div className="min-w-0">
              <span className="block truncate text-[17px] font-bold tracking-tight text-white">
                ImmoAI
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition-colors duration-300 hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-200"
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

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-2 py-4">
        {!collapsed ? (
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
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
                collapsed
                  ? "justify-center px-2"
                  : "gap-3 px-3"
              } ${
                active
                  ? "bg-white/[0.07] text-white"
                  : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
              }`}
            >
              {active && !collapsed ? (
                <span
                  className="absolute left-0 top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-violet-400 to-fuchsia-500 shadow-[0_0_12px_rgba(167,139,250,0.6)]"
                  aria-hidden
                />
              ) : null}
              {active && collapsed ? (
                <span
                  className="absolute inset-x-1 inset-y-1 rounded-lg bg-white/[0.08] ring-1 ring-violet-500/30"
                  aria-hidden
                />
              ) : null}
              <Icon
                className={`nav-icon-glow relative z-[1] h-[18px] w-[18px] shrink-0 transition-colors duration-300 ${
                  active ? "text-violet-300" : ""
                }`}
                strokeWidth={1.65}
              />
              {!collapsed ? <span className="relative z-[1]">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="mx-3 mb-3 shrink-0 rounded-xl border border-violet-500/15 bg-gradient-to-br from-violet-500/[0.12] to-transparent p-4">
          <p className="text-xs font-semibold text-zinc-200">Automatisation</p>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            Relances IA, visites et matching.
          </p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full w-[55%] rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500 transition-all duration-700"
              aria-hidden
            />
          </div>
        </div>
      ) : (
        <div className="mx-2 mb-2 flex shrink-0 justify-center rounded-lg border border-violet-500/15 bg-violet-500/5 p-2">
          <Sparkles
            className="h-4 w-4 text-violet-400/90"
            strokeWidth={1.65}
            aria-hidden
          />
        </div>
      )}

      <div className="mt-auto shrink-0 border-t border-white/[0.06] px-2 py-2">
        <form action={signOut}>
          <button
            type="submit"
            title="Déconnexion"
            className={`flex w-full items-center rounded-xl py-2.5 text-[13px] font-medium text-zinc-600 transition-all duration-300 hover:bg-white/[0.04] hover:text-zinc-300 ${
              collapsed ? "justify-center px-2" : "gap-3 px-3 text-left"
            }`}
          >
            <LogOut className="h-[17px] w-[17px] shrink-0 opacity-80" />
            {!collapsed ? "Déconnexion" : null}
          </button>
        </form>
      </div>

      <div className="shrink-0 border-t border-white/[0.06] px-2 py-4">
        <div
          className={`flex items-center gap-3 ${collapsed ? "justify-center" : "px-2"}`}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-600/25 text-xs font-bold text-violet-100 ring-1 ring-white/10"
            title={userName}
          >
            {initials(userName)}
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-200">
                {userName}
              </p>
              {agencyName ? (
                <p className="truncate text-xs text-zinc-600">{agencyName}</p>
              ) : (
                <p className="truncate text-xs text-zinc-600">Agence</p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
