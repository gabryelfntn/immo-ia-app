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
  Lightbulb,
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
  backgroundColor: "#ffffff",
  border: "1px solid rgba(15,23,42,0.1)",
  borderRadius: "12px",
  color: "#0f172a",
  boxShadow: "0 12px 40px -12px rgba(15,23,42,0.12)",
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
      <span className="text-xs font-medium text-slate-600">— vs M-1</span>
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
      {pct}% <span className="font-normal text-slate-500">vs mois dernier</span>
    </span>
  );
}

const metricsLayout = [
  {
    key: "biensActifs" as const,
    label: "Biens actifs",
    sub: "Statut disponible · % = nouveaux biens vs M-1",
    icon: Home,
    accent: "from-stone-600 to-emerald-900",
    bar: "from-stone-600 to-emerald-800",
    decimals: 0,
    suffix: "",
    momKey: "biensActifs" as const,
  },
  {
    key: "vendusLouesCeMois" as const,
    label: "Vendus / loués",
    sub: "Ce mois-ci",
    icon: TrendingUp,
    accent: "from-amber-700 to-orange-900",
    bar: "from-amber-600 to-amber-800",
    decimals: 0,
    suffix: "",
    momKey: "vendusLoues" as const,
  },
  {
    key: "prospectsChauds" as const,
    label: "Prospects chauds",
    sub: "Statut « Chaud » · % = nouveaux « chaud » vs M-1",
    icon: Flame,
    accent: "from-orange-800 to-stone-900",
    bar: "from-orange-700 to-stone-800",
    decimals: 0,
    suffix: "",
    momKey: "prospectsChauds" as const,
  },
  {
    key: "totalContacts" as const,
    label: "Contacts",
    sub: "Base totale · % = nouveaux contacts vs M-1",
    icon: Users,
    accent: "from-stone-600 to-neutral-900",
    bar: "from-stone-600 to-stone-800",
    decimals: 0,
    suffix: "",
    momKey: "totalContacts" as const,
  },
  {
    key: "annoncesIA" as const,
    label: "Annonces IA",
    sub: "Générations cumulées",
    icon: Sparkles,
    accent: "from-stone-700 to-neutral-900",
    bar: "from-stone-600 to-stone-800",
    decimals: 0,
    suffix: "",
    momKey: "annoncesIA" as const,
  },
  {
    key: "tauxConversion" as const,
    label: "Taux conversion",
    sub: "",
    icon: Percent,
    accent: "from-neutral-800 to-stone-950",
    bar: "from-stone-700 to-neutral-900",
    decimals: 1,
    suffix: "%",
    momKey: "tauxConversion" as const,
  },
];

type Props = {
  data: DashboardPayload;
  todayLabel: string;
  /** Message si chargement OK mais périmètre vide (ex. agent sans assignations). */
  dataLoadHint?: string | null;
};

export function DashboardClient({ data, todayLabel, dataLoadHint }: Props) {
  const { metrics, chartBiensParMois, chartContactsStatut, chartFlux } = data;

  const donutTotal = chartContactsStatut.reduce((s, x) => s + x.value, 0);
  const maxPipeline = Math.max(
    1,
    ...data.pipelineFunnel.map((f) => f.count)
  );

  return (
    <div className="space-y-10">
      {dataLoadHint ? (
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          {dataLoadHint}
        </div>
      ) : null}
      <header className="flex flex-col gap-4 border-b border-slate-100 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{todayLabel}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {data.userFirstName
              ? `Bonjour, ${data.userFirstName}`
              : `Bienvenue`}
          </h1>
          <p className="mt-2 text-lg font-medium text-stone-600/95">
            {data.agencyName}
          </p>
          <p className="mt-3 max-w-2xl text-slate-600">
            Tableau de bord en temps réel : portefeuille, pipeline commercial,
            tâches et performance des annonces IA.
          </p>
        </div>
      </header>

      <section className="card-luxury p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Lightbulb className="h-5 w-5 text-amber-600" />
          Actions recommandées aujourd&apos;hui
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Suggestions basées sur la récence des contacts, le pipeline et le
          score interne.
        </p>
        {data.suggestions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Rien de prioritaire détecté pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.suggestions.map((s) => (
              <li key={s.id}>
                <Link
                  href={s.href}
                  className="block rounded-xl border border-stone-200/90 bg-[#faf9f6] px-4 py-3 transition-colors hover:border-stone-400 hover:bg-stone-100"
                >
                  <p className="font-semibold text-stone-900">{s.title}</p>
                  <p className="mt-1 text-sm text-stone-600">{s.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card-luxury p-6 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <GitBranch className="h-5 w-5 text-stone-600" />
            Pipeline commercial
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Répartition des contacts par étape (mandat / vente).
          </p>
          <ul className="mt-5 space-y-3">
            {data.pipelineFunnel.map((row) => (
              <li key={row.stage}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-slate-600">{row.label}</span>
                  <span className="tabular-nums text-slate-500">{row.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-stone-700 to-neutral-900 transition-all duration-500"
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
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <ListTodo className="h-5 w-5 text-amber-400" />
            Tâches
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Rappels et suivis à traiter.
          </p>
          <dl className="mt-4 flex flex-1 flex-col gap-3 text-sm">
            <div className="flex justify-between rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2">
              <dt className="text-slate-500">Ouvertes</dt>
              <dd className="font-bold tabular-nums text-slate-800">
                {data.tasksSummary.openCount}
              </dd>
            </div>
            <div className="flex justify-between rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2">
              <dt className="text-rose-800/90">En retard</dt>
              <dd className="font-bold tabular-nums text-rose-900">
                {data.tasksSummary.overdue}
              </dd>
            </div>
            <div className="flex justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
              <dt className="text-amber-800/90">Aujourd&apos;hui</dt>
              <dd className="font-bold tabular-nums text-amber-950">
                {data.tasksSummary.dueToday}
              </dd>
            </div>
          </dl>
          <Link
            href="/dashboard/taches"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900"
          >
            Voir les tâches
          </Link>
        </div>
      </section>

      <section className="card-luxury overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Target className="h-5 w-5 text-stone-600" />
            Priorités commerciales
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Contacts classés par score de priorité (chaleur, étape, données,
            récence).
          </p>
        </div>
        <div className="overflow-x-auto p-6">
          {data.topLeads.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun contact à afficher.</p>
          ) : (
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-3 pr-4 font-semibold">Contact</th>
                  <th className="pb-3 pr-4 font-semibold">Score</th>
                  <th className="pb-3 pr-4 font-semibold">Étape</th>
                  <th className="pb-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                {data.topLeads.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/80"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/dashboard/contacts/${row.id}`}
                        className="font-medium text-slate-900 hover:text-stone-900"
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-lg border border-stone-300 bg-stone-100 px-2 py-0.5 text-xs font-bold tabular-nums text-stone-900">
                        {row.score}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-500">
                      {PIPELINE_STAGE_LABELS[row.pipeline_stage]}
                    </td>
                    <td className="py-3 text-slate-500">
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
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Bell className="h-5 w-5 text-stone-700" />
              Relances automatiques
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Contacts inactifs (14+ j., hors opt-out), envois ce mois et
              désinscriptions relances.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/relances"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900"
            >
              <Bell className="h-4 w-4 text-stone-700" />
              À relancer
            </Link>
            <Link
              href="/dashboard/relances/historique"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900"
            >
              <Calendar className="h-4 w-4 text-stone-600" />
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
              className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-4"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {cell.label}
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                <AnimatedNumber value={cell.value} />
              </p>
              <p className="mt-1 text-xs text-slate-600">{cell.hint}</p>
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
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {m.label}
                </p>
                <p className="mt-1 text-[11px] text-slate-600">
                  {m.key === "tauxConversion"
                    ? `${metrics.clientsCount} client(s) sur ${metrics.totalContacts} contacts`
                    : m.sub}
                </p>
                <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-slate-900">
                  <AnimatedNumber value={raw} decimals={m.decimals} />
                  {m.suffix ? (
                    <span className="text-2xl font-bold text-slate-500">
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
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-stone-600">
            Biens ajoutés
          </h2>
          <p className="mt-1 text-xs text-slate-500">6 derniers mois</p>
          <div className="mt-4 h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartBiensParMois}
                margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={CHART_TOOLTIP} />
                <Bar
                  dataKey="biens"
                  name="Biens"
                  fill="#44403c"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-luxury p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-stone-600">
            Contacts par statut
          </h2>
          <p className="mt-1 text-xs text-slate-500">Répartition CRM</p>
          <div className="mt-4 h-[280px] w-full min-w-0">
            {donutTotal === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
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
                    wrapperStyle={{ fontSize: 12, color: "#64748b" }}
                    formatter={(value) => (
                      <span style={{ color: "#334155" }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="card-luxury p-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-stone-600">
          Flux portefeuille
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Nouveaux biens disponibles vs ventes & locations finalisées (par mois)
        </p>
        <div className="mt-4 h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartFlux}
              margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip contentStyle={CHART_TOOLTIP} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: "#64748b" }}
                formatter={(value) => (
                  <span style={{ color: "#334155" }}>{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="disponibles"
                name="Nouveaux disponibles"
                stroke="#44403c"
                strokeWidth={2.5}
                dot={{ fill: "#44403c", r: 3 }}
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
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <UserCircle className="h-5 w-5 text-stone-700" />
            Activité récente
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Derniers biens et contacts ajoutés
          </p>
        </div>

        <div className="grid lg:grid-cols-2">
          <div className="border-b border-slate-100 p-6 lg:border-b-0 lg:border-r lg:border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-600">
              Biens
            </h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-slate-500">
                    <th className="pb-3 pr-4 font-semibold">Bien</th>
                    <th className="pb-3 pr-4 font-semibold">Statut</th>
                    <th className="pb-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  {data.recentProperties.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-6 text-center text-slate-500"
                      >
                        Aucun bien
                      </td>
                    </tr>
                  ) : (
                    data.recentProperties.map((p) => (
                      <tr
                        key={p.id}
                        className="border-t border-slate-100 transition-colors hover:bg-slate-50/80"
                      >
                        <td className="py-3 pr-4">
                          <Link
                            href={`/dashboard/biens/${p.id}`}
                            className="font-medium text-slate-900 hover:text-stone-900"
                          >
                            <span className="line-clamp-1">{p.title}</span>
                            <span className="mt-0.5 block text-xs font-normal text-slate-500">
                              {p.city}
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex rounded-full border border-slate-200/90 bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-slate-600">
                            {
                              PROPERTY_STATUS_LABELS[
                                p.status as PropertyStatus
                              ]
                            }
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-3 text-xs text-slate-500">
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
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-600">
              Contacts
            </h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-slate-500">
                    <th className="pb-3 pr-4 font-semibold">Contact</th>
                    <th className="pb-3 pr-4 font-semibold">Statut</th>
                    <th className="pb-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  {data.recentContacts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-6 text-center text-slate-500"
                      >
                        Aucun contact
                      </td>
                    </tr>
                  ) : (
                    data.recentContacts.map((c) => (
                      <tr
                        key={c.id}
                        className="border-t border-slate-100 transition-colors hover:bg-slate-50/80"
                      >
                        <td className="py-3 pr-4">
                          <Link
                            href={`/dashboard/contacts/${c.id}`}
                            className="font-medium text-slate-900 hover:text-stone-700"
                          >
                            {c.name}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex rounded-full border border-slate-200/90 bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-slate-600">
                            {
                              CONTACT_STATUS_LABELS[
                                c.status as ContactStatus
                              ]
                            }
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-3 text-xs text-slate-500">
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
