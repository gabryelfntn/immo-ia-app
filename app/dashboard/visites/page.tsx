import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Calendar, Plus } from "lucide-react";

type Search = { property?: string; contact?: string };

type VisitRow = {
  id: string;
  visit_date: string;
  client_interest: string;
  summary: string;
  property_id: string;
  contact_id: string;
  properties: { title: string; city: string } | null;
  contacts: { first_name: string; last_name: string } | null;
};

function interestBadgeClass(interest: string): string {
  switch (interest) {
    case "fort":
      return "border-emerald-500/35 bg-emerald-500/15 text-emerald-200 shadow-[0_0_20px_-8px_rgba(52,211,153,0.45)]";
    case "moyen":
      return "border-amber-500/35 bg-amber-500/12 text-amber-800 shadow-[0_0_16px_-8px_rgba(245,158,11,0.25)]";
    case "faible":
      return "border-rose-500/30 bg-rose-500/10 text-rose-200";
    default:
      return "border-slate-200/90 bg-white/[0.06] text-slate-600";
  }
}

function interestLabel(interest: string): string {
  switch (interest) {
    case "fort":
      return "Fort";
    case "moyen":
      return "Moyen";
    case "faible":
      return "Faible";
    default:
      return interest;
  }
}

function formatVisitDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long",
    }).format(new Date(iso + "T12:00:00"));
  } catch {
    return iso;
  }
}

type Props = { searchParams?: Promise<Search> };

export default async function VisitesPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const propertyFilter = sp.property?.trim() || "";
  const contactFilter = sp.contact?.trim() || "";

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
        <h1 className="text-3xl font-bold text-slate-900">Visites</h1>
        <p className="mt-2 text-sm text-slate-500">
          Aucune agence associée à votre compte.
        </p>
      </div>
    );
  }

  const agencyId = profile.agency_id as string;

  const { data: propertiesList } = await supabase
    .from("properties")
    .select("id, title, city")
    .eq("agency_id", agencyId)
    .order("title", { ascending: true });

  const { data: contactsList } = await supabase
    .from("contacts")
    .select("id, first_name, last_name")
    .eq("agency_id", agencyId)
    .order("last_name", { ascending: true });

  let query = supabase
    .from("visit_reports")
    .select(
      `
      id,
      visit_date,
      client_interest,
      summary,
      property_id,
      contact_id,
      properties ( title, city ),
      contacts ( first_name, last_name )
    `
    )
    .eq("agency_id", agencyId)
    .order("visit_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (propertyFilter) {
    query = query.eq("property_id", propertyFilter);
  }
  if (contactFilter) {
    query = query.eq("contact_id", contactFilter);
  }

  const { data: visits, error } = await query;

  if (error) {
    return (
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-slate-900">Visites</h1>
        <p className="mt-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error.message}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Appliquez la migration{" "}
          <code className="rounded bg-white/[0.06] px-1">20260409240000_visit_reports</code>{" "}
          dans Supabase si la table est absente.
        </p>
      </div>
    );
  }

  const list = (visits ?? []) as unknown as VisitRow[];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500/90">
            Activité
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
            Visites
          </h1>
          <p className="mt-2 text-slate-500">
            {list.length} rapport{list.length !== 1 ? "s" : ""} enregistré
            {list.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/visites/new"
          className="btn-luxury-primary inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all duration-300"
        >
          <Plus className="relative z-10 h-5 w-5" strokeWidth={2.5} />
          <span className="relative z-10">Nouvelle visite</span>
        </Link>
      </div>

      <form
        action="/dashboard/visites"
        method="get"
        className="mt-10 flex flex-wrap items-center gap-3"
      >
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/90 bg-white/[0.03] p-2 backdrop-blur-sm">
          <select
            name="property"
            defaultValue={propertyFilter}
            className="max-w-[220px] rounded-full border border-slate-200/90 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 outline-none transition-all duration-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-500/20"
          >
            <option value="">Tous les biens</option>
            {(propertiesList ?? []).map((p) => (
              <option
                key={p.id as string}
                value={p.id as string}
                className="bg-white"
              >
                {(p.title as string).slice(0, 60)}
                {(p.title as string).length > 60 ? "…" : ""}
              </option>
            ))}
          </select>
          <select
            name="contact"
            defaultValue={contactFilter}
            className="max-w-[220px] rounded-full border border-slate-200/90 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 outline-none transition-all duration-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-500/20"
          >
            <option value="">Tous les contacts</option>
            {(contactsList ?? []).map((c) => (
              <option
                key={c.id as string}
                value={c.id as string}
                className="bg-white"
              >
                {c.first_name as string} {c.last_name as string}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full bg-amber-500/15 px-5 py-2 text-sm font-semibold text-amber-800 transition-all duration-300 hover:bg-amber-500/25"
          >
            Filtrer
          </button>
        </div>
        {(propertyFilter || contactFilter) && (
          <Link
            href="/dashboard/visites"
            className="text-sm font-medium text-slate-500 transition-all duration-300 hover:text-amber-400"
          >
            Réinitialiser
          </Link>
        )}
      </form>

      {list.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-white/[0.03] px-8 py-20 text-center">
          <Calendar className="mb-4 h-12 w-12 text-slate-600" />
          <p className="text-xl font-semibold text-slate-700">
            Aucun rapport de visite
          </p>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            {propertyFilter || contactFilter
              ? "Aucun résultat pour ces filtres."
              : "Créez un compte-rendu structuré avec l’IA après une visite."}
          </p>
          <Link
            href="/dashboard/visites/new"
            className="btn-luxury-primary mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
          >
            <Plus className="relative z-10 h-5 w-5" />
            <span className="relative z-10">Nouvelle visite</span>
          </Link>
        </div>
      ) : (
        <ul className="mt-10 flex flex-col gap-4">
          {list.map((v) => {
            const pTitle = v.properties?.title ?? "Bien";
            const pCity = v.properties?.city ?? "";
            const cName = v.contacts
              ? `${v.contacts.first_name} ${v.contacts.last_name}`
              : "Client";
            const interest = v.client_interest as string;
            return (
              <li key={v.id}>
                <article className="card-luxury rounded-2xl border border-slate-200/90 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-stone-400/20 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${interestBadgeClass(interest)}`}
                        >
                          Intérêt : {interestLabel(interest)}
                        </span>
                        <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="h-4 w-4 text-stone-600/80" />
                          {formatVisitDate(v.visit_date)}
                        </span>
                      </div>
                      <h2 className="mt-3 text-lg font-bold text-slate-900">
                        {pTitle}
                        {pCity ? (
                          <span className="font-normal text-slate-500">
                            {" "}
                            · {pCity}
                          </span>
                        ) : null}
                      </h2>
                      <p className="mt-1 text-sm font-medium text-stone-800">
                        {cName}
                      </p>
                      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
                        {v.summary}
                      </p>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
