"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Bell,
  Calendar,
  Flame,
  Home,
  Percent,
  Sparkles,
  TrendingUp,
  UserCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { DashboardPayload } from "@/lib/dashboard/fetch-dashboard-data";
import { PROPERTY_STATUS_LABELS } from "@/lib/properties/labels";
import type { PropertyStatus } from "@/lib/properties/schema";
import { CONTACT_STATUS_LABELS } from "@/lib/contacts/labels";
import type { ContactStatus } from "@/lib/contacts/schema";

const CHART_TOOLTIP = {
  backgroundColor: "#12121a",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  color: "#e4e4e7",
};

function AnimatedNumber({
  value,
  duration = 1000,
  decimals = 0,
}: {
  value: number;
  duration?: number;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const to = value;
    function frame(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (to - from) * eased;
      if (decimals > 0) {
        setDisplay(Math.round(v * 10 ** decimals) / 10 ** decimals);
      } else {
        setDisplay(Math.round(v));
      }
      if (t < 1) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, decimals]);

  return (
    <span className="tabular-nums">
      {decimals > 0 ? display.toFixed(decimals) : display}
    </span>
  );
}

function MomBadge({ pct }: { pct: number | null }) {
  if (pct === null) {
    return (
      <span className="text-xs font-medium text-zinc-600">— vs M-1</span>
    );
  }
  const positive = pct >= 0;
  return (
    <span
      className={`text-xs font-semibold ${
        positive ? "text-emerald-400" : "text-rose-400"
      }`}
    >
      {positive ? "+" : ""}
      {pct}% <span className="font-normal text-zinc-500">vs mois dernier</span>
    </span>
  );
}

const metricsLayout = [
  {
    key: "biensActifs" as const,
    label: "Biens actifs",
    sub: "Statut disponible · % = nouveaux biens vs M-1",
    icon: Home,
    accent: "from-emerald-500/90 to-teal-600",
    bar: "from-emerald-500 to-teal-500",
    decimals: 0,
    suffix: "",
    momKey: "biensActifs" as const,
  },
  {
    key: "vendusLouesCeMois" as const,
    label: "Vendus / loués",
    sub: "Ce mois-ci",
    icon: TrendingUp,
    accent: "from-amber-500/90 to-orange-600",
    bar: "from-amber-500 to-orange-500",
    decimals: 0,
    suffix: "",
    momKey: "vendusLoues" as const,
  },
  {
    key: "prospectsChauds" as const,
    label: "Prospects chauds",
    sub: "Statut « Chaud » · % = nouveaux « chaud » vs M-1",
    icon: Flame,
    accent: "from-red-500/90 to-rose-600",
    bar: "from-red-500 to-rose-500",
    decimals: 0,
    suffix: "",
    momKey: "prospectsChauds" as const,
  },
  {
    key: "totalContacts" as const,
    label: "Contacts",
    sub: "Base totale · % = nouveaux contacts vs M-1",
    icon: Users,
    accent: "from-indigo-500/90 to-violet-600",
    bar: "from-indigo-500 to-violet-500",
    decimals: 0,
    suffix: "",
    momKey: "totalContacts" as const,
  },
  {
    key: "annoncesIA" as const,
    label: "Annonces IA",
    sub: "Générations cumulées",
    icon: Sparkles,
    accent: "from-violet-500/90 to-fuchsia-600",
    bar: "from-violet-500 to-fuchsia-500",
    decimals: 0,
    suffix: "",
    momKey: "annoncesIA" as const,
  },
  {
    key: "tauxConversion" as const,
    label: "Taux conversion",
    sub: "",
    icon: Percent,
    accent: "from-cyan-500/90 to-indigo-600",
    bar: "from-cyan-500 to-indigo-500",
    decimals: 1,
    suffix: "%",
    momKey: "tauxConversion" as const,
  },
];

type Props = {
  data: DashboardPayload;
  todayLabel: string;
};

export function DashboardClient({ data, todayLabel }: Props) {
  const { metrics, chartBiensParMois, chartContactsStatut, chartFlux } = data;

  const donutTotal = chartContactsStatut.reduce((s, x) => s + x.value, 0);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 border-b border-white/[0.06] pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">{todayLabel}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {data.userFirstName
              ? `Bonjour, ${data.userFirstName}`
              : `Bienvenue`}
          </h1>
          <p className="mt-2 text-lg text-indigo-200/90">{data.agencyName}</p>
          <p className="mt-3 max-w-2xl text-zinc-400">
            Tableau de bord en temps réel : portefeuille, pipeline commercial et
            performance des annonces IA.
          </p>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12121a] shadow-[0_0_40px_-20px_rgba(245,158,11,0.18)]">
        <div className="flex flex-col gap-4 border-b border-white/[0.06] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <Bell className="h-5 w-5 text-amber-500" />
              Relances automatiques
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Contacts inactifs (14+ j., hors opt-out), envois ce mois et
              désinscriptions relances.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/relances"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-white"
            >
              <Bell className="h-4 w-4 text-amber-500" />
              À relancer
            </Link>
            <Link
              href="/dashboard/relances/historique"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-white"
            >
              <Calendar className="h-4 w-4 text-indigo-400" />
              Historique
            </Link>
          </div>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              {
                label: "Inactifs 14+ j.",
                value: data.relances.inactive14Plus,
                hint: "Éligibles relance (sans opt-out)",
              },
              {
                label: "Relances envoyées",
                value: data.relances.followupsSentThisMonth,
                hint: "Ce mois-ci",
              },
              {
                label: "Échecs d’envoi",
                value: data.relances.followupsFailedThisMonth,
                hint: "Ce mois-ci",
              },
              {
                label: "Opt-out relances",
                value: data.relances.optedOutCount,
                hint: "Contacts exclus",
              },
            ] as const
          ).map((cell) => (
            <div
              key={cell.label}
              className="rounded-xl border border-white/[0.06] bg-[#0a0a0f]/60 px-4 py-4"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                {cell.label}
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-white">
                <AnimatedNumber value={cell.value} />
              </p>
              <p className="mt-1 text-xs text-zinc-600">{cell.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metricsLayout.map((m) => {
          const Icon = m.icon;
          const raw = metrics[m.key];
          const mom = metrics.momPct[m.momKey];
          return (
            <li key={m.key}>
              <div
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12121a] p-5 shadow-[0_0_48px_-20px_rgba(99,102,241,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-500/25 hover:shadow-[0_0_56px_-16px_rgba(99,102,241,0.55)]"
              >
                <div
                  className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${m.accent} text-white shadow-lg`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {m.label}
                </p>
                <p className="mt-1 text-[11px] text-zinc-600">
                  {m.key === "tauxConversion"
                    ? `${metrics.clientsCount} client(s) sur ${metrics.totalContacts} contacts`
                    : m.sub}
                </p>
                <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-white">
                  <AnimatedNumber value={raw} decimals={m.decimals} />
                  {m.suffix ? (
                    <span className="text-2xl font-bold text-zinc-300">
                      {m.suffix}
                    </span>
                  ) : null}
                </p>
                <div className="mt-2">
                  <MomBadge pct={mom} />
                </div>
                <div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${m.bar} opacity-90`}
                  aria-hidden
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 shadow-[0_0_40px_-24px_rgba(245,158,11,0.25)]">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-indigo-400/90">
            Biens ajoutés
          </h2>
          <p className="mt-1 text-xs text-zinc-500">6 derniers mois</p>
          <div className="mt-4 h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartBiensParMois}
                margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  axisLine={{ stroke: "#3f3f46" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={CHART_TOOLTIP} />
                <Bar
                  dataKey="biens"
                  name="Biens"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 shadow-[0_0_40px_-24px_rgba(99,102,241,0.3)]">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-amber-500/90">
            Contacts par statut
          </h2>
          <p className="mt-1 text-xs text-zinc-500">Répartition CRM</p>
          <div className="mt-4 h-[280px] w-full min-w-0">
            {donutTotal === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                Aucun contact à afficher
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartContactsStatut}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={96}
                    paddingAngle={2}
                  >
                    {chartContactsStatut.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }}
                    formatter={(value) => (
                      <span className="text-zinc-400">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 shadow-[0_0_48px_-24px_rgba(99,102,241,0.35)]">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-violet-400/90">
          Flux portefeuille
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Nouveaux biens disponibles vs ventes & locations finalisées (par mois)
        </p>
        <div className="mt-4 h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartFlux}
              margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                axisLine={{ stroke: "#3f3f46" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip contentStyle={CHART_TOOLTIP} />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => (
                  <span className="text-zinc-400">{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="disponibles"
                name="Nouveaux disponibles"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ fill: "#6366f1", r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="vendusLoues"
                name="Vendus / loués"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ fill: "#f59e0b", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12121a] shadow-[0_0_40px_-20px_rgba(245,158,11,0.2)]">
        <div className="border-b border-white/[0.06] px-6 py-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <UserCircle className="h-5 w-5 text-amber-500" />
            Activité récente
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Derniers biens et contacts ajoutés
          </p>
        </div>

        <div className="grid lg:grid-cols-2">
          <div className="border-b border-white/[0.06] p-6 lg:border-b-0 lg:border-r">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400/90">
              Biens
            </h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-zinc-500">
                    <th className="pb-3 pr-4 font-semibold">Bien</th>
                    <th className="pb-3 pr-4 font-semibold">Statut</th>
                    <th className="pb-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  {data.recentProperties.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-6 text-center text-zinc-500"
                      >
                        Aucun bien
                      </td>
                    </tr>
                  ) : (
                    data.recentProperties.map((p) => (
                      <tr
                        key={p.id}
                        className="border-t border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="py-3 pr-4">
                          <Link
                            href={`/dashboard/biens/${p.id}`}
                            className="font-medium text-white hover:text-indigo-300"
                          >
                            <span className="line-clamp-1">{p.title}</span>
                            <span className="mt-0.5 block text-xs font-normal text-zinc-500">
                              {p.city}
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium text-zinc-300">
                            {
                              PROPERTY_STATUS_LABELS[
                                p.status as PropertyStatus
                              ]
                            }
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-3 text-xs text-zinc-500">
                          {new Intl.DateTimeFormat("fr-FR", {
                            dateStyle: "medium",
                          }).format(new Date(p.created_at))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500/90">
              Contacts
            </h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-zinc-500">
                    <th className="pb-3 pr-4 font-semibold">Contact</th>
                    <th className="pb-3 pr-4 font-semibold">Statut</th>
                    <th className="pb-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  {data.recentContacts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-6 text-center text-zinc-500"
                      >
                        Aucun contact
                      </td>
                    </tr>
                  ) : (
                    data.recentContacts.map((c) => (
                      <tr
                        key={c.id}
                        className="border-t border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="py-3 pr-4">
                          <Link
                            href={`/dashboard/contacts/${c.id}`}
                            className="font-medium text-white hover:text-amber-200/90"
                          >
                            {c.name}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium text-zinc-300">
                            {
                              CONTACT_STATUS_LABELS[
                                c.status as ContactStatus
                              ]
                            }
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-3 text-xs text-zinc-500">
                          {new Intl.DateTimeFormat("fr-FR", {
                            dateStyle: "medium",
                          }).format(new Date(c.created_at))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
