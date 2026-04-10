"use client";

import { CopyTextButton } from "@/app/dashboard/_components/copy-text-button";
import { ExternalLink, Mail, MapPin, MessageSquare, Phone } from "lucide-react";

type Props = {
  email: string;
  phone: string;
  mapsQuery?: string | null;
};

export function ContactQuickActions({ email, phone, mapsQuery }: Props) {
  const telHref = `tel:${phone.replace(/\s/g, "")}`;
  const smsHref = `sms:${phone.replace(/\s/g, "")}`;
  const mailHref = `mailto:${encodeURIComponent(email)}`;
  const mapsHref = mapsQuery?.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery.trim())}`
    : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={mailHref}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:border-stone-400"
      >
        <Mail className="h-3.5 w-3.5" />
        E-mail
      </a>
      <a
        href={telHref}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:border-stone-400"
      >
        <Phone className="h-3.5 w-3.5" />
        Appeler
      </a>
      <a
        href={smsHref}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:border-stone-400"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        SMS
      </a>
      {mapsHref ? (
        <a
          href={mapsHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:border-stone-400"
        >
          <MapPin className="h-3.5 w-3.5" />
          Cartes
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>
      ) : null}
      <CopyTextButton text={email} label="Copier e-mail" />
      <CopyTextButton text={phone} label="Copier tél." />
    </div>
  );
}
