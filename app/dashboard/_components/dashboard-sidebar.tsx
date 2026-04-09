"use client";

import {
  Building2,
  Bell,
  Calendar,
  Home,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Users,
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
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

export function DashboardSidebar({ userName, agencyName }: Props) {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col border-r border-white/[0.06] bg-app-sidebar shadow-[8px_0_40px_-16px_rgba(30,27,46,0.45)] max-lg:rounded-none lg:left-4 lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-[268px] lg:rounded-[28px] lg:border lg:border-white/[0.08]"
    >
      <div className="border-b border-white/[0.06] px-5 py-6 lg:px-6 lg:py-7">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 transition-opacity duration-200 hover:opacity-95"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-900/40">
            <Home className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <span className="block text-lg font-bold tracking-tight text-white">
              ImmoAI
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Suite agence
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Menu principal
        </p>
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                active
                  ? "bg-white/[0.12] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                  : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
              }`}
            >
              <Icon
                className={`nav-icon-glow h-[18px] w-[18px] shrink-0 ${
                  active ? "text-violet-300" : "text-slate-500"
                }`}
                strokeWidth={1.75}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mb-3 rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-600/35 via-violet-900/20 to-fuchsia-900/25 p-4 shadow-inner shadow-black/20">
        <p className="text-xs font-bold text-white">Automatisation</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
          Relances IA, visites et matching — tout est dans le menu.
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/25">
          <div
            className="h-full w-3/5 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400"
            aria-hidden
          />
        </div>
      </div>

      <div className="mt-auto border-t border-white/[0.06] px-3 py-3">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-slate-500 transition-colors duration-200 hover:bg-white/[0.06] hover:text-slate-200"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0 opacity-80" />
            Déconnexion
          </button>
        </form>
      </div>

      <div className="border-t border-white/[0.06] px-4 py-4 lg:px-5 lg:py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/40 to-fuchsia-500/35 text-sm font-bold text-violet-100 ring-2 ring-white/10">
            {initials(userName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-100">
              {userName}
            </p>
            {agencyName ? (
              <p className="truncate text-xs text-slate-500">{agencyName}</p>
            ) : (
              <p className="truncate text-xs text-slate-600">Agence</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
