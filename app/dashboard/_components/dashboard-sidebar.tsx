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
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col border-r border-white/[0.06] bg-app-sidebar/95 shadow-[4px_0_48px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl">
      <div className="px-5 py-7">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3.5 outline-none transition-opacity duration-300 hover:opacity-90"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-900/50 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-[1.02]">
            <Home className="h-[22px] w-[22px]" strokeWidth={1.65} />
          </span>
          <div>
            <span className="block text-[17px] font-bold tracking-tight text-white">
              ImmoAI
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Suite agence
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
          Navigation
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
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-300 ${
                active
                  ? "bg-white/[0.07] text-white"
                  : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
              }`}
            >
              {active ? (
                <span
                  className="absolute left-0 top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-violet-400 to-fuchsia-500 shadow-[0_0_12px_rgba(167,139,250,0.6)]"
                  aria-hidden
                />
              ) : null}
              <Icon
                className={`nav-icon-glow relative h-[18px] w-[18px] shrink-0 transition-colors duration-300 ${
                  active ? "text-violet-300" : ""
                }`}
                strokeWidth={1.65}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mb-3 rounded-xl border border-violet-500/15 bg-gradient-to-br from-violet-500/[0.12] to-transparent p-4">
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

      <div className="mt-auto border-t border-white/[0.06] px-3 py-2">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-zinc-600 transition-all duration-300 hover:bg-white/[0.04] hover:text-zinc-300"
          >
            <LogOut className="h-[17px] w-[17px] shrink-0 opacity-80" />
            Déconnexion
          </button>
        </form>
      </div>

      <div className="border-t border-white/[0.06] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-600/25 text-xs font-bold text-violet-100 ring-1 ring-white/10">
            {initials(userName)}
          </div>
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
        </div>
      </div>
    </aside>
  );
}
