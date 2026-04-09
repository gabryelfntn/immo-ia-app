"use client";

import {
  Building2,
  Bell,
  Calendar,
  ChevronsLeft,
  ChevronsRight,
  Home,
  LayoutDashboard,
  ListTodo,
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
  { href: "/dashboard/taches", label: "Tâches", icon: ListTodo },
  { href: "/dashboard/annonces", label: "Annonces IA", icon: Sparkles },
] as const;

type Props = {
  userName: string;
  agencyName: string | null;
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
  narrowDesktop,
  mobileDrawerOpen,
  isDesktopLayout,
  onToggleSidebar,
}: Props) {
  const pathname = usePathname();
  const collapsed = narrowDesktop && isDesktopLayout;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/90 bg-white/95 shadow-[4px_0_40px_-12px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-[width,transform] duration-300 ease-out motion-reduce:transition-none ${
        narrowDesktop ? "w-[272px] lg:w-[76px]" : "w-[272px]"
      } ${
        mobileDrawerOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
      } lg:translate-x-0`}
    >
      <div
        className={`flex shrink-0 items-center gap-2 border-b border-slate-100 py-5 ${
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
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 ring-1 ring-violet-500/20 transition-transform duration-300 group-hover:scale-[1.02]">
            <Home className="h-[22px] w-[22px]" strokeWidth={1.65} />
          </span>
          {!collapsed ? (
            <div className="min-w-0">
              <span className="block truncate text-[17px] font-bold tracking-tight text-slate-900">
                ImmoAI
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-slate-50 text-slate-500 transition-colors duration-300 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
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
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
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
                  ? "bg-violet-50 text-violet-800 shadow-sm shadow-violet-500/10 ring-1 ring-violet-200/80"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {active && !collapsed ? (
                <span
                  className="absolute left-0 top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500 shadow-[0_0_12px_rgba(124,58,237,0.45)]"
                  aria-hidden
                />
              ) : null}
              {active && collapsed ? (
                <span
                  className="absolute inset-x-1 inset-y-1 rounded-lg bg-violet-50 ring-1 ring-violet-200/90"
                  aria-hidden
                />
              ) : null}
              <Icon
                className={`nav-icon-glow relative z-[1] h-[18px] w-[18px] shrink-0 transition-colors duration-300 ${
                  active ? "text-violet-600" : "text-slate-500"
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
        <div className="mx-3 mb-3 shrink-0 rounded-xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-fuchsia-50/40 p-4 shadow-sm shadow-violet-500/5">
          <p className="text-xs font-semibold text-slate-800">Automatisation</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
            Relances IA, visites et matching.
          </p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-200/90">
            <div
              className="h-full w-[55%] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700"
              aria-hidden
            />
          </div>
        </div>
      ) : (
        <div className="mx-2 mb-2 flex shrink-0 justify-center rounded-lg border border-violet-200/70 bg-violet-50/80 p-2">
          <Sparkles
            className="h-4 w-4 text-violet-600"
            strokeWidth={1.65}
            aria-hidden
          />
        </div>
      )}

      <div className="mt-auto shrink-0 border-t border-slate-100 px-2 py-2">
        <form action={signOut}>
          <button
            type="submit"
            title="Déconnexion"
            className={`flex w-full items-center rounded-xl py-2.5 text-[13px] font-medium text-slate-500 transition-all duration-300 hover:bg-slate-50 hover:text-slate-800 ${
              collapsed ? "justify-center px-2" : "gap-3 px-3 text-left"
            }`}
          >
            <LogOut className="h-[17px] w-[17px] shrink-0 opacity-80" />
            {!collapsed ? "Déconnexion" : null}
          </button>
        </form>
      </div>

      <div className="shrink-0 border-t border-slate-100 px-2 py-4">
        <div
          className={`flex items-center gap-3 ${collapsed ? "justify-center" : "px-2"}`}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-xs font-bold text-violet-800 ring-1 ring-violet-200/80"
            title={userName}
          >
            {initials(userName)}
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">
                {userName}
              </p>
              {agencyName ? (
                <p className="truncate text-xs text-slate-500">{agencyName}</p>
              ) : (
                <p className="truncate text-xs text-slate-500">Agence</p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
