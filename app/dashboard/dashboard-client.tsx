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
  GitBranch,
  Home,
  ListTodo,
  Percent,
  Sparkles,
  Target,
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
import { PIPELINE_STAGE_LABELS } from "@/lib/contacts/pipeline";
import type { ContactStatus } from "@/lib/contacts/schema";

const CHART_TOOLTIP = {
  backgroundColor: "#16161f",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  color: "#f4f4f5",
  boxShadow: "0 12px 40px -12px rgba(0,0,0,0.55)",
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
  const maxPipeline = Math.max(
    1,
    ...data.pipelineFunnel.map((f) => f.count)
  );

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 border-b border-white/[0.06] pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">{todayLabel}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
            {data.userFirstName
              ? `Bonjour, ${data.userFirstName}`
              : `Bienvenue`}
          </h1>
          <p className="mt-2 text-lg font-medium text-violet-400/95">
            {data.agencyName}
          </p>
          <p className="mt-3 max-w-2xl text-zinc-600">
            Tableau de bord en temps réel : portefeuille, pipeline commercial,
            tâches et performance des annonces IA.
          </p>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card-luxury p-6 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-50">
            <GitBranch className="h-5 w-5 text-violet-400" />
            Pipeline commercial
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Répartition des contacts par étape (mandat / vente).
          </p>
          <ul className="mt-5 space-y-3">
            {data.pipelineFunnel.map((row) => (
              <li key={row.stage}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-zinc-300">{row.label}</span>
                  <span className="tabular-nums text-zinc-500">{row.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                    style={{
                      width: `${Math.round((row.count / maxPipeline) * 100)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-luxury flex flex-col p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-50">
            <ListTodo className="h-5 w-5 text-amber-400" />
            Tâches
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Rappels et suivis à traiter.
          </p>
          <dl className="mt-4 flex flex-1 flex-col gap-3 text-sm">
            <div className="flex justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
              <dt className="text-zinc-500">Ouvertes</dt>
              <dd className="font-bold tabular-nums text-zinc-100">
                {data.tasksSummary.openCount}
              </dd>
            </div>
            <div className="flex justify-between rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2">
              <dt className="text-rose-200/90">En retard</dt>
              <dd className="font-bold tabular-nums text-rose-100">
                {data.tasksSummary.overdue}
              </dd>
            </div>
            <div className="flex justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
              <dt className="text-amber-200/90">Aujourd&apos;hui</dt>
              <dd className="font-bold tabular-nums text-amber-100">
                {data.tasksSummary.dueToday}
              </dd>
            </div>
          </dl>
          <Link
            href="/dashboard/taches"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-violet-500/35 hover:bg-violet-500/10"
          >
            Voir les tâches
          </Link>
        </div>
      </section>

      <section className="card-luxury overflow-hidden">
        <div className="border-b border-white/[0.06] px-6 py-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-50">
            <Target className="h-5 w-5 text-fuchsia-400" />
            Priorités commerciales
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Contacts classés par score de priorité (chaleur, étape, données,
            récence).
          </p>
        </div>
        <div className="overflow-x-auto p-6">
          {data.topLeads.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucun contact à afficher.</p>
          ) : (
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-zinc-500">
                  <th className="pb-3 pr-4 font-semibold">Contact</th>
                  <th className="pb-3 pr-4 font-semibold">Score</th>
                  <th className="pb-3 pr-4 font-semibold">Étape</th>
                  <th className="pb-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                {data.topLeads.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-white/[0.06] transition-colors hover:bg-white/[0.04]"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/dashboard/contacts/${row.id}`}
                        className="font-medium text-zinc-50 hover:text-violet-300"
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-xs font-bold tabular-nums text-violet-200">
                        {row.score}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-zinc-400">
                      {PIPELINE_STAGE_LABELS[row.pipeline_stage]}
                    </td>
                    <td className="py-3 text-zinc-400">
                      {CONTACT_STATUS_LABELS[row.status]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="card-luxury overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-white/[0.06] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-50">
              <Bell className="h-5 w-5 text-violet-500" />
              Relances automatiques
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Contacts inactifs (14+ j., hors opt-out), envois ce mois et
              désinscriptions relances.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/relances"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-violet-500/35 hover:bg-violet-500/10 hover:text-white"
            >
              <Bell className="h-4 w-4 text-violet-500" />
              À relancer
            </Link>
            <Link
              href="/dashboard/relances/historique"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-fuchsia-500/35 hover:bg-fuchsia-500/10 hover:text-white"
            >
              <Calendar className="h-4 w-4 text-fuchsia-500" />
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
              className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-4"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                {cell.label}
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-50">
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
                className="card-luxury group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5"
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
                <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-zinc-50">
                  <AnimatedNumber value={raw} decimals={m.decimals} />
                  {m.suffix ? (
                    <span className="text-2xl font-bold text-zinc-500">
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
        <div className="card-luxury p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-violet-400">
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
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-luxury p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-fuchsia-400">
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
                      <span style={{ color: "#d4d4d8" }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="card-luxury p-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-violet-400">
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
                wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }}
                formatter={(value) => (
                  <span style={{ color: "#d4d4d8" }}>{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="disponibles"
                name="Nouveaux disponibles"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={{ fill: "#8b5cf6", r: 3 }}
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

      <section className="card-luxury overflow-hidden">
        <div className="border-b border-white/[0.06] px-6 py-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-50">
            <UserCircle className="h-5 w-5 text-violet-500" />
            Activité récente
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Derniers biens et contacts ajoutés
          </p>
        </div>

        <div className="grid lg:grid-cols-2">
          <div className="border-b border-white/[0.06] p-6 lg:border-b-0 lg:border-r lg:border-white/[0.06]">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
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
                        className="border-t border-white/[0.06] transition-colors hover:bg-white/[0.04]"
                      >
                        <td className="py-3 pr-4">
                          <Link
                            href={`/dashboard/biens/${p.id}`}
                            className="font-medium text-zinc-50 hover:text-violet-300"
                          >
                            <span className="line-clamp-1">{p.title}</span>
                            <span className="mt-0.5 block text-xs font-normal text-zinc-500">
                              {p.city}
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-zinc-300">
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
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-400">
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
                        className="border-t border-white/[0.06] transition-colors hover:bg-white/[0.04]"
                      >
                        <td className="py-3 pr-4">
                          <Link
                            href={`/dashboard/contacts/${c.id}`}
                            className="font-medium text-zinc-50 hover:text-fuchsia-300"
                          >
                            {c.name}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-zinc-300">
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
