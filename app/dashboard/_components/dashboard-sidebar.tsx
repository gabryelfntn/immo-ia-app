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
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col border-r border-white/[0.06] bg-gradient-to-b from-[#12121a] via-[#0f0f14] to-[#0a0a0f] shadow-[4px_0_40px_-12px_rgba(0,0,0,0.85)]">
      <div className="border-b border-white/[0.06] px-6 py-7">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 transition-all duration-300"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 group-hover:shadow-indigo-500/50">
            <Home className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <span className="block text-lg font-bold tracking-tight text-white">
              ImmoAI
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-indigo-300/80">
              Luxury Suite
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-6">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                active
                  ? "border border-indigo-500/35 bg-indigo-500/15 text-indigo-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                  : "border border-transparent text-zinc-400 hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-zinc-200"
              }`}
            >
              <Icon
                className={`nav-icon-glow h-[18px] w-[18px] shrink-0 ${
                  active ? "text-indigo-300" : "text-zinc-500"
                }`}
                strokeWidth={1.75}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/[0.06] px-3 py-4">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-500 transition-all duration-300 hover:bg-white/[0.04] hover:text-zinc-300"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0 opacity-70" />
            Déconnexion
          </button>
        </form>
      </div>

      <div className="border-t border-white/[0.06] px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/25 to-indigo-500/30 text-sm font-bold text-amber-200 ring-2 ring-amber-500/20">
            {initials(userName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-100">
              {userName}
            </p>
            {agencyName ? (
              <p className="truncate text-xs text-zinc-500">{agencyName}</p>
            ) : (
              <p className="truncate text-xs text-zinc-600">Agence</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
