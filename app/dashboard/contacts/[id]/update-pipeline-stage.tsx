"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateContactPipelineStage } from "../actions";
import { PIPELINE_STAGE_LABELS } from "@/lib/contacts/pipeline";
import { PIPELINE_STAGES } from "@/lib/contacts/schema";
import type { PipelineStage } from "@/lib/contacts/schema";

type Props = {
  contactId: string;
  currentStage: PipelineStage;
};

export function UpdatePipelineStageControl({
  contactId,
  currentStage,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState(currentStage);

  useEffect(() => {
    setValue(currentStage);
  }, [currentStage]);

  function onChange(next: PipelineStage) {
    if (next === currentStage) return;
    setError(null);
    setValue(next);
    startTransition(async () => {
      const result = await updateContactPipelineStage(contactId, next);
      if (!result.ok) {
        setError(result.error);
        setValue(currentStage);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="pipeline-stage"
        className="text-xs font-semibold uppercase tracking-wider text-slate-500"
      >
        Étape pipeline
      </label>
      <select
        id="pipeline-stage"
        value={value}
        disabled={pending}
        onChange={(e) => onChange(e.target.value as PipelineStage)}
        className="max-w-xs rounded-xl border border-slate-200/90 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all duration-300 focus:border-stone-500/50 focus:ring-2 focus:ring-stone-500/25 disabled:opacity-50"
      >
        {PIPELINE_STAGES.map((s) => (
          <option key={s} value={s} className="bg-white">
            {PIPELINE_STAGE_LABELS[s]}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
