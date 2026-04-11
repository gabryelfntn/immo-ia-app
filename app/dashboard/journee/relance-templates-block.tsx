"use client";

import { useState } from "react";
import { PIPELINE_STAGE_LABELS } from "@/lib/contacts/pipeline";
import { RELANCE_TEMPLATES } from "@/lib/relance/message-templates";
import type { PipelineStage } from "@/lib/contacts/schema";
import { PIPELINE_STAGES } from "@/lib/contacts/schema";
import { Copy, Check } from "lucide-react";

function CopyLine({ text }: { text: string }) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <li className="flex gap-2 rounded-lg border border-slate-100 bg-slate-50/80 p-2 text-xs text-slate-700">
      <p className="min-w-0 flex-1 leading-relaxed">{text}</p>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-stone-800"
        title="Copier"
        aria-label="Copier le texte"
      >
        {done ? (
          <Check className="h-4 w-4 text-emerald-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </li>
  );
}

export function RelanceTemplatesBlock() {
  return (
    <div className="mt-4 space-y-4">
      {(PIPELINE_STAGES as readonly PipelineStage[]).map((stage) => {
        const lines = RELANCE_TEMPLATES[stage];
        return (
          <div key={stage}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {PIPELINE_STAGE_LABELS[stage]}
            </p>
            <ul className="mt-2 space-y-2">
              {lines.map((t, i) => (
                <CopyLine key={i} text={t} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
