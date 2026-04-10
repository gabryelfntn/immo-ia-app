"use client";

import { Plus, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import {
  createAgencyTag,
  setContactTag,
} from "../contact-tags-actions";

export type AgencyTagRow = {
  id: string;
  slug: string;
  label: string;
  color: string | null;
};

type Props = {
  contactId: string;
  agencyTags: AgencyTagRow[];
  initialTagIds: string[];
};

export function ContactTagsPanel({
  contactId,
  agencyTags,
  initialTagIds,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState(() => new Set(initialTagIds));
  const [pending, startTransition] = useTransition();
  const [newLabel, setNewLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const toggle = useCallback(
    (tagId: string, next: boolean) => {
      setError(null);
      startTransition(async () => {
        const r = await setContactTag(contactId, tagId, next);
        if (!r.ok) {
          setError(r.error);
          return;
        }
        setSelected((prev) => {
          const n = new Set(prev);
          if (next) n.add(tagId);
          else n.delete(tagId);
          return n;
        });
      });
    },
    [contactId]
  );

  const onCreate = useCallback(() => {
    const label = newLabel.trim();
    if (!label) return;
    setError(null);
    startTransition(async () => {
      const r = await createAgencyTag({ label });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setNewLabel("");
      if (r.tagId) {
        const link = await setContactTag(contactId, r.tagId, true);
        if (!link.ok) {
          setError(link.error);
          return;
        }
        setSelected((prev) => new Set(prev).add(r.tagId!));
      }
      router.refresh();
    });
  }, [contactId, newLabel, router]);

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-6 card-luxury">
      <div className="flex items-center gap-2">
        <Tag className="h-5 w-5 text-stone-600" />
        <h2 className="text-lg font-bold text-slate-900">Tags & segmentation</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Étiquetez ce contact pour filtrer la liste (investisseur, urgent, etc.).
      </p>

      {error ? (
        <p className="mt-3 rounded-lg border border-red-200/80 bg-red-50/80 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <ul className="mt-4 flex flex-wrap gap-2">
        {agencyTags.map((t) => {
          const on = selected.has(t.id);
          return (
            <li key={t.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => toggle(t.id, !on)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  on
                    ? "border-stone-800 bg-stone-800 text-white"
                    : "border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-400"
                } disabled:opacity-50`}
              >
                {t.label}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-4">
        <div className="min-w-[12rem] flex-1">
          <label
            htmlFor="new-tag-label"
            className="text-[10px] font-bold uppercase tracking-wider text-stone-500"
          >
            Nouveau tag agence
          </label>
          <input
            id="new-tag-label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="ex. Investisseur"
            className="mt-1 w-full rounded-xl border border-stone-200 bg-[#faf9f6] px-3 py-2 text-sm outline-none focus:border-stone-400"
          />
        </div>
        <button
          type="button"
          disabled={pending || !newLabel.trim()}
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Créer & appliquer
        </button>
      </div>
    </div>
  );
}
