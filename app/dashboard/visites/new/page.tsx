import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { VisitReportForm } from "./visit-report-form";

export default async function NewVisitPage() {
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
        <h1 className="text-3xl font-bold text-zinc-50">Nouvelle visite</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Aucune agence associée à votre compte.
        </p>
      </div>
    );
  }

  const agencyId = profile.agency_id as string;

  const { data: propertiesRows } = await supabase
    .from("properties")
    .select("id, title, city")
    .eq("agency_id", agencyId)
    .order("title", { ascending: true });

  const { data: contactsRows } = await supabase
    .from("contacts")
    .select("id, first_name, last_name")
    .eq("agency_id", agencyId)
    .order("last_name", { ascending: true });

  const properties = (propertiesRows ?? []).map((p) => {
    const title = p.title as string;
    const city = p.city as string;
    return {
      id: p.id as string,
      label: city ? `${title} — ${city}` : title,
    };
  });

  const contacts = (contactsRows ?? []).map((c) => ({
    id: c.id as string,
    label: `${c.first_name as string} ${c.last_name as string}`,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/dashboard/visites"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-amber-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Visites
      </Link>

      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-amber-500/90">
        Rapport IA
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-50">
        Nouvelle visite
      </h1>
      <p className="mt-2 max-w-2xl text-zinc-500">
        Générez un compte-rendu professionnel à partir de vos notes, puis
        enregistrez-le pour votre agence.
      </p>

      {properties.length === 0 || contacts.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-sm text-amber-800">
          <p>
            Ajoutez au moins un bien et un contact pour créer un rapport de
            visite.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link
              href="/dashboard/biens/new"
              className="font-semibold text-amber-400 underline-offset-4 hover:underline"
            >
              Nouveau bien
            </Link>
            <Link
              href="/dashboard/contacts/new"
              className="font-semibold text-amber-400 underline-offset-4 hover:underline"
            >
              Nouveau contact
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-10">
          <VisitReportForm properties={properties} contacts={contacts} />
        </div>
      )}
    </div>
  );
}
