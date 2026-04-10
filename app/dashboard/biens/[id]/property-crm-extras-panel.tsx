"use client";

import {
  updatePropertyListingExtras,
  updatePropertyPrice,
} from "@/app/dashboard/biens/actions";
import {
  MANDATE_CHECKLIST_KEYS,
  MANDATE_CHECKLIST_LABELS,
  type MandateChecklistKey,
  type MandateChecklistState,
} from "@/lib/properties/mandate-checklist";
import { formatPriceEUR } from "@/lib/properties/labels";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type HistoryRow = { id: string; price: number; recorded_at: string };

type Props = {
  propertyId: string;
  transaction: "vente" | "location";
  currentPrice: number;
  initialListingUrl: string | null;
  initialChecklist: MandateChecklistState;
  priceHistory: HistoryRow[];
};

export function PropertyCrmExtrasPanel({
  propertyId,
  transaction,
  currentPrice,
  initialListingUrl,
  initialChecklist,
  priceHistory,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [listingUrl, setListingUrl] = useState(initialListingUrl ?? "");
  const [checklist, setChecklist] = useState<MandateChecklistState>(() => ({
    ...initialChecklist,
  }));
  const [priceInput, setPriceInput] = useState(String(currentPrice));

  const checklistPayload = useMemo(() => {
    const o: Record<string, boolean> = {};
    for (const k of MANDATE_CHECKLIST_KEYS) {
      o[k] = checklist[k] === true;
    }
    return o;
  }, [checklist]);

  const saveUrl = () => {
    setErr(null);
    startTransition(async () => {
      const res = await updatePropertyListingExtras(propertyId, {
        listing_url: listingUrl.trim() || null,
      });
      if (!res.ok) setErr(res.error);
      else router.refresh();
    });
  };

  const saveChecklist = () => {
    setErr(null);
    startTransition(async () => {
      const res = await updatePropertyListingExtras(propertyId, {
        mandate_checklist: checklistPayload,
      });
      if (!res.ok) setErr(res.error);
      else router.refresh();
    });
  };

  const savePrice = () => {
    setErr(null);
    startTransition(async () => {
      const res = await updatePropertyPrice(propertyId, priceInput);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      router.refresh();
    });
  };

  const toggle = (k: MandateChecklistKey) => {
    setChecklist((c) => ({
      ...c,
      [k]: c[k] === true ? undefined : true,
    }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          Annonce en ligne
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Lien vers le portail (SeLoger, etc.).
        </p>
        <input
          value={listingUrl}
          onChange={(e) => setListingUrl(e.target.value)}
          className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="https://…"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => saveUrl()}
            className="rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            Enregistrer le lien
          </button>
          {listingUrl.trim() ? (
            <a
              href={listingUrl.trim()}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
            >
              Ouvrir
            </a>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          Prix & historique
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Modifier le prix enregistre une ligne d&apos;historique.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="text-xs text-slate-500">Nouveau prix (€)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="mt-1 w-40 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => savePrice()}
            className="rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            Mettre à jour le prix
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Affiché : {formatPriceEUR(currentPrice, transaction)}
        </p>
        {priceHistory.length ? (
          <ul className="mt-4 max-h-40 space-y-2 overflow-y-auto text-xs text-slate-600">
            {priceHistory.map((h) => (
              <li
                key={h.id}
                className="flex justify-between border-b border-slate-100 pb-1"
              >
                <span>{formatPriceEUR(h.price, transaction)}</span>
                <span className="text-slate-400">
                  {new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(h.recorded_at))}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-slate-500">
            Aucun changement de prix enregistré encore.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury lg:col-span-2">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          Check-list mandat / annonce
        </h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {MANDATE_CHECKLIST_KEYS.map((k) => (
            <li key={k}>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={checklist[k] === true}
                  onChange={() => toggle(k)}
                  className="rounded border-slate-300"
                />
                {MANDATE_CHECKLIST_LABELS[k]}
              </label>
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={pending}
          onClick={() => saveChecklist()}
          className="mt-4 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Enregistrer la check-list
        </button>
      </section>

      {err ? <p className="text-sm text-red-600 lg:col-span-2">{err}</p> : null}
    </div>
  );
}
