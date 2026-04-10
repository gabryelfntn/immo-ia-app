"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";

type Props = {
  text: string;
  label?: string;
  className?: string;
};

export function CopyTextButton({ text, label = "Copier", className }: Props) {
  const [done, setDone] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    } catch {
      /* ignore */
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-stone-400 hover:bg-stone-50"
      }
    >
      {done ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2} />
      ) : (
        <Copy className="h-3.5 w-3.5" strokeWidth={2} />
      )}
      {done ? "Copié" : label}
    </button>
  );
}
