import {
  Building2,
  Home,
  Sparkles,
  TrendingUp,
  UserCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const metricsConfig = [
  {
    key: "properties",
    label: "Biens",
    icon: Building2,
    accent: "from-indigo-500 to-violet-600",
    bar: "bg-gradient-to-r from-indigo-500 to-violet-500",
  },
  {
    key: "contacts",
    label: "Contacts",
    icon: Users,
    accent: "from-amber-500 to-orange-600",
    bar: "bg-gradient-to-r from-amber-500 to-orange-500",
  },
  {
    key: "listings",
    label: "Annonces IA",
    icon: Sparkles,
    accent: "from-violet-500 to-fuchsia-600",
    bar: "bg-gradient-to-r from-violet-500 to-fuchsia-500",
  },
  {
    key: "disponible",
    label: "Biens disponibles",
    icon: Home,
    accent: "from-emerald-500 to-teal-600",
    bar: "bg-gradient-to-r from-emerald-500 to-teal-500",
  },
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return (
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Tableau de bord
        </h1>
        <p className="mt-2 text-zinc-500">
          Aucune agence associée à votre compte.
        </p>
      </div>
    );
  }

  const agencyId = profile.agency_id;

  const { data: agency } = await supabase
    .from("agencies")
    .select("name")
    .eq("id", agencyId)
    .maybeSingle();

  const agencyName = agency?.name ?? "Votre agence";

  const [
    propertiesRes,
    contactsRes,
    listingsRes,
    disponibleRes,
  ] = await Promise.all([
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", agencyId),
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", agencyId),
    supabase
      .from("generated_listings")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", agencyId),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .eq("status", "disponible"),
  ]);

  const counts = {
    properties: propertiesRes.error ? 0 : (propertiesRes.count ?? 0),
    contacts: contactsRes.error ? 0 : (contactsRes.count ?? 0),
    listings: listingsRes.error ? 0 : (listingsRes.count ?? 0),
    disponible: disponibleRes.error ? 0 : (disponibleRes.count ?? 0),
  };

  const { data: recentProps } = await supabase
    .from("properties")
    .select("id, title, city, created_at")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentContacts } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, created_at")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false })
    .limit(5);

  const formatTime = (iso: string) =>
    new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
    }).format(new Date(iso));

  return (
    <div className="space-y-12">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-400/90">
          Bienvenue
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {agencyName}
        </h1>
        <p className="mt-3 max-w-xl text-lg text-zinc-400">
          Vue d&apos;ensemble de votre portefeuille et de votre activité récente.
        </p>
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {metricsConfig.map((m) => {
          const Icon = m.icon;
          const value =
            counts[m.key as keyof typeof counts] ?? 0;
          return (
            <li key={m.key}>
              <div className="card-luxury group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 transition-all duration-300 hover:-translate-y-1">
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${m.accent} text-white shadow-lg`}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <p className="text-sm font-medium text-zinc-500">{m.label}</p>
                <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-white">
                  {value}
                </p>
                <div
                  className={`absolute bottom-0 left-0 right-0 h-1 ${m.bar} opacity-90`}
                  aria-hidden
                />
              </div>
            </li>
          );
        })}
      </ul>

      <section className="rounded-2xl border border-white/[0.08] bg-[#12121a] p-8 card-luxury">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            Activité récente
          </h2>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300/90">
              Derniers biens
            </h3>
            <ul className="mt-4 space-y-3">
              {(recentProps ?? []).length === 0 ? (
                <li className="text-sm text-zinc-500">Aucun bien pour le moment.</li>
              ) : (
                (recentProps ?? []).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/dashboard/biens/${p.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#0a0a0f]/80 px-4 py-3 transition-all duration-300 hover:border-indigo-500/30 hover:bg-white/[0.03]"
                    >
                      <span className="min-w-0 font-medium text-zinc-200">
                        <span className="line-clamp-1">{p.title as string}</span>
                        <span className="mt-0.5 block text-xs text-zinc-500">
                          {p.city as string}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-zinc-500">
                        {formatTime(p.created_at as string)}
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500/90">
              Derniers contacts
            </h3>
            <ul className="mt-4 space-y-3">
              {(recentContacts ?? []).length === 0 ? (
                <li className="text-sm text-zinc-500">
                  Aucun contact pour le moment.
                </li>
              ) : (
                (recentContacts ?? []).map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/dashboard/contacts/${c.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#0a0a0f]/80 px-4 py-3 transition-all duration-300 hover:border-amber-500/25 hover:bg-white/[0.03]"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <UserCircle className="h-8 w-8 shrink-0 text-zinc-600" />
                        <span className="font-medium text-zinc-200">
                          {(c.first_name as string) + " " + (c.last_name as string)}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-zinc-500">
                        {formatTime(c.created_at as string)}
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
