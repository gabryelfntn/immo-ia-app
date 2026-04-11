"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import {
  addContactPropertyLink,
  removeContactPropertyLink,
} from "@/app/dashboard/contacts/contact-property-links-actions";
import { Users, Trash2 } from "lucide-react";

const LINK_TYPES = [
  { value: "favori", label: "Favori" },
  { value: "visite_prevue", label: "Visite prévue" },
  { value: "offre", label: "Offre" },
  { value: "autre", label: "Autre" },
] as const;

type LinkRow = {
  id: string;
  link_type: string;
  note: string | null;
  contact_id: string;
  contacts: { first_name: string; last_name: string } | null;
};

type ContactOption = { id: string; first_name: string; last_name: string };

type Props = {
  propertyId: string;
  initialLinks: LinkRow[];
  contactOptions: ContactOption[];
};

export function PropertyContactLinksPanel({
  propertyId,
  initialLinks,
  contactOptions,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [contactId, setContactId] = useState("");
  const [linkType, setLinkType] =
    useState<(typeof LINK_TYPES)[number]["value"]>("favori");

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!contactId) {
      setError("Choisissez un contact.");
      return;
    }
    startTransition(async () => {
      const res = await addContactPropertyLink({
        contactId,
        propertyId,
        linkType,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setContactId("");
      router.refresh();
    });
  }

  function onRemove(link: LinkRow) {
    setError(null);
    startTransition(async () => {
      const res = await removeContactPropertyLink(
        link.id,
        link.contact_id,
        propertyId
      );
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  const linkedKeys = new Set(
    initialLinks.map((l) => `${l.contact_id}:${l.link_type}`)
  );

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-800">
        <Users className="h-4 w-4 text-stone-600" />
        Contacts liés
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Prospects et clients associés à ce bien.
      </p>

      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="mt-4 space-y-2 text-sm">
        {initialLinks.length === 0 ? (
          <li className="text-slate-500">Aucun lien pour l’instant.</li>
        ) : (
          initialLinks.map((l) => {
            const c = l.contacts;
            const who = c
              ? `${c.first_name} ${c.last_name}`.trim()
              : "Contact";
            return (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2"
              >
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/contacts/${l.contact_id}`}
                    className="font-medium text-stone-800 hover:underline"
                  >
                    {who}
                  </Link>
                  <span className="text-slate-500">
                    {" "}
                    ·{" "}
                    {LINK_TYPES.find((x) => x.value === l.link_type)?.label ??
                      l.link_type}
                  </span>
                  {l.note ? (
                    <span className="block text-xs text-slate-500">
                      {l.note}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onRemove(l)}
                  className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-rose-700 disabled:opacity-50"
                  aria-label="Retirer le lien"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })
        )}
      </ul>

      {contactOptions.length > 0 ? (
        <form onSubmit={onAdd} className="mt-6 space-y-3 border-t border-slate-100 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-600">
              Contact
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                required
              >
                <option value="">— Choisir —</option>
                {contactOptions.map((c) => {
                  const taken = linkedKeys.has(`${c.id}:${linkType}`);
                  return (
                    <option key={c.id} value={c.id} disabled={taken}>
                      {c.first_name} {c.last_name}
                      {taken ? " (déjà lié, ce type)" : ""}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Type
              <select
                value={linkType}
                onChange={(e) =>
                  setLinkType(e.target.value as typeof linkType)
                }
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {LINK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="submit"
            disabled={pending || !contactId}
            className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-900 disabled:opacity-50"
          >
            Ajouter le lien
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          Aucun contact dans l’agence à associer pour le moment.
        </p>
      )}
    </section>
  );
}
