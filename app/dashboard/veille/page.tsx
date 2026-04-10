import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { VeilleClient } from "./veille-client";

export default async function VeillePage() {
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
    return <p className="text-sm text-slate-500">Aucune agence associée.</p>;
  }

  const { data: searches } = await supabase
    .from("saved_property_searches")
    .select("id, name, city_query, transaction, type_query, price_max")
    .eq("agency_id", profile.agency_id)
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false });

  const list = searches ?? [];
  const matchesBySearch: Record<
    string,
    { id: string; title: string; city: string; price: number }[]
  > = {};

  for (const s of list) {
    let q = supabase
      .from("properties")
      .select("id, title, city, price, transaction, type")
      .eq("agency_id", profile.agency_id)
      .eq("status", "disponible")
      .limit(30);

    const city = (s.city_query as string | null)?.trim();
    if (city) {
      q = q.ilike("city", `%${city}%`);
    }
    const tx = (s.transaction as string | null)?.trim();
    if (tx === "vente" || tx === "location") {
      q = q.eq("transaction", tx);
    }
    const typ = (s.type_query as string | null)?.trim();
    if (typ) {
      q = q.ilike("type", `%${typ}%`);
    }
    const pm = s.price_max != null ? Number(s.price_max) : null;
    if (pm != null && Number.isFinite(pm) && pm > 0) {
      q = q.lte("price", pm);
    }

    const { data: props } = await q;
    matchesBySearch[s.id as string] = (props ?? []).map((p) => ({
      id: p.id as string,
      title: p.title as string,
      city: p.city as string,
      price: Number(p.price),
    }));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">Veille biens</h1>
      <p className="mt-2 text-sm text-slate-600">
        Suis des critères et retrouve rapidement les biens disponibles de
        l’agence qui matchent.
      </p>
      <div className="mt-8">
        <VeilleClient initialSearches={list} matchesBySearch={matchesBySearch} />
      </div>
    </div>
  );
}
