"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSavedSearch, deleteSavedSearch } from "./actions";

type SearchRow = {
  id: string;
  name: string;
  city_query: string | null;
  transaction: string | null;
  type_query: string | null;
  price_max: number | null;
};

type Match = { id: string; title: string; city: string; price: number };

type Props = {
  initialSearches: SearchRow[];
  matchesBySearch: Record<string, Match[]>;
};

export function VeilleClient({ initialSearches, matchesBySearch }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [transaction, setTransaction] = useState("");
  const [typeQ, setTypeQ] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const r = await createSavedSearch({
      name,
      city_query: city || undefined,
      transaction: transaction || undefined,
      type_query: typeQ || undefined,
      price_max: priceMax ? Number(priceMax) : undefined,
    });
    setLoading(false);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    router.refresh();
    setName("");
    setCity("");
    setTransaction("");
    setTypeQ("");
    setPriceMax("");
    setMsg("Recherche enregistrée.");
  }

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-800">
          Nouvelle veille
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Enregistre des critères : les biens de ton agence correspondants
          apparaissent ci-dessous (mise à jour à l’affichage).
        </p>
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-500">Nom</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-500">Ville (contient)</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-500">Transaction</span>
            <select
              value={transaction}
              onChange={(e) => setTransaction(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">—</option>
              <option value="vente">Vente</option>
              <option value="location">Location</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-500">Type (ex. appartement)</span>
            <input
              value={typeQ}
              onChange={(e) => setTypeQ(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-500">Prix max (€)</span>
            <input
              type="number"
              min={0}
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="mt-1 w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "…" : "Enregistrer"}
            </button>
            {msg ? (
              <p className="mt-2 text-sm text-slate-600" role="status">
                {msg}
              </p>
            ) : null}
          </div>
        </form>
      </section>

      <section className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-800">
          Mes veilles
        </h2>
        {initialSearches.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune veille enregistrée.</p>
        ) : (
          initialSearches.map((s) => (
            <article
              key={s.id}
              className="rounded-2xl border border-slate-200/90 bg-white p-5 card-luxury"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{s.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {[
                      s.city_query && `Ville: ${s.city_query}`,
                      s.transaction && `Transaction: ${s.transaction}`,
                      s.type_query && `Type: ${s.type_query}`,
                      s.price_max != null && `Max ${s.price_max} €`,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Critères larges"}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs font-medium text-red-700 hover:underline"
                  onClick={async () => {
                    await deleteSavedSearch(s.id);
                    router.refresh();
                  }}
                >
                  Supprimer
                </button>
              </div>
              <ul className="mt-4 space-y-2">
                {(matchesBySearch[s.id] ?? []).length === 0 ? (
                  <li className="text-sm text-slate-500">
                    Aucun bien ne correspond pour l’instant.
                  </li>
                ) : (
                  (matchesBySearch[s.id] ?? []).map((m) => (
                    <li key={m.id}>
                      <a
                        href={`/dashboard/biens/${m.id}`}
                        className="text-sm font-medium text-amber-900 hover:underline"
                      >
                        {m.title}
                      </a>
                      <span className="text-slate-500">
                        {" "}
                        — {m.city} ·{" "}
                        {m.price.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
