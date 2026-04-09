"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  biens: "Biens",
  contacts: "Contacts",
  annonces: "Annonces IA",
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

type Props = {
  agencyName: string | null;
};

export function DashboardHeader({ agencyName }: Props) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = segmentLabel(seg, i);
    const isLast = i === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0a0a0f]/80 px-6 py-4 backdrop-blur-xl lg:px-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1 text-sm">
          {crumbs.map((c, i) => (
            <span key={c.href} className="flex items-center gap-1">
              {i > 0 ? (
                <ChevronRight className="h-3.5 w-3.5 text-zinc-600" aria-hidden />
              ) : null}
              {c.isLast ? (
                <span className="font-semibold text-zinc-100">{c.label}</span>
              ) : (
                <Link
                  href={c.href}
                  className="font-medium text-zinc-500 transition-all duration-300 hover:text-indigo-300"
                >
                  {c.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
        {agencyName ? (
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            <span className="text-amber-500/90">●</span> {agencyName}
          </p>
        ) : null}
      </div>
    </header>
  );
}
