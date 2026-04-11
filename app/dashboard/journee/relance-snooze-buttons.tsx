"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { snoozeContactRelance } from "@/app/dashboard/contacts/actions";

type Props = {
  contactId: string;
};

export function RelanceSnoozeButtons({ contactId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(days: 1 | 7) {
    startTransition(async () => {
      const res = await snoozeContactRelance(contactId, days);
      if (res.ok) router.refresh();
    });
  }

  return (
    <span className="inline-flex shrink-0 gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(1)}
        className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-stone-50 disabled:opacity-50"
        title="Reporter les relances 1 jour"
      >
        +1 j
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(7)}
        className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-stone-50 disabled:opacity-50"
        title="Reporter les relances 7 jours"
      >
        +7 j
      </button>
    </span>
  );
}
