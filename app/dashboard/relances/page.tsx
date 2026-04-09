import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RelancesClient, type InactiveContact } from "./_components/relances-client";

type Search = { days?: string };
type Props = { searchParams?: Promise<Search> };

function parseDays(raw: string | undefined): 7 | 14 | 30 {
  if (raw === "14") return 14;
  if (raw === "30") return 30;
  return 7;
}

function computeDaysInactive(lastActivityISO: string): number {
  const last = new Date(lastActivityISO).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - last);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default async function RelancesPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const days = parseDays(sp.days);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-white">Relances</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Aucune agence associée à votre compte.
        </p>
      </div>
    );
  }

  const agencyId = profile.agency_id as string;

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select(
      "id, first_name, last_name, email, status, last_contacted_at, created_at"
    )
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-white">Relances</h1>
        <p className="mt-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error.message}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Si vous venez d’ajouter{" "}
          <code className="rounded bg-white/10 px-1">last_contacted_at</code>,
          appliquez la migration{" "}
          <code className="rounded bg-white/10 px-1">
            20260409250000_contacts_last_contacted_at
          </code>
          .
        </p>
      </div>
    );
  }

  const rows = contacts ?? [];

  const inactive: InactiveContact[] = rows
    .map((c) => {
      const lastActivityISO =
        (typeof c.last_contacted_at === "string" && c.last_contacted_at) ||
        (c.created_at as string);

      return {
        id: c.id as string,
        first_name: c.first_name as string,
        last_name: c.last_name as string,
        email: c.email as string,
        status: c.status as string,
        lastActivityISO,
        daysInactive: computeDaysInactive(lastActivityISO),
      };
    })
    .filter((c) => c.daysInactive >= days)
    .sort((a, b) => b.daysInactive - a.daysInactive);

  return <RelancesClient contacts={inactive} filterDays={days} />;
}

