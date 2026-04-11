"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PIPELINE_STAGE_LABELS } from "@/lib/contacts/pipeline";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/contacts/schema";
import { updateContactPipelineStage } from "../actions";

type Card = { id: string; name: string; status: string };

type Props = {
  columns: Record<PipelineStage, Card[]>;
};

function StageColumn({
  stage,
  children,
}: {
  stage: PipelineStage;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[420px] flex-col rounded-2xl border bg-white p-3 shadow-sm transition-colors ${
        isOver ? "border-amber-400 bg-amber-50/50" : "border-slate-200"
      }`}
    >
      <h2 className="border-b border-slate-100 px-1 pb-2 text-xs font-bold uppercase tracking-wider text-stone-700">
        {PIPELINE_STAGE_LABELS[stage]}
      </h2>
      <div className="mt-3 flex flex-1 flex-col gap-2">{children}</div>
    </div>
  );
}

function KanbanCard({ card }: { card: Card }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: card.id });
  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm shadow-sm ${
        isDragging ? "opacity-50" : ""
      }`}
      {...listeners}
      {...attributes}
    >
      <p className="font-semibold text-slate-900">{card.name}</p>
      <p className="mt-1 text-xs text-slate-500">{card.status}</p>
      <Link
        href={`/dashboard/contacts/${card.id}`}
        className="mt-2 inline-block text-xs font-medium text-amber-900 hover:underline"
        onPointerDown={(e) => e.stopPropagation()}
      >
        Ouvrir la fiche →
      </Link>
    </div>
  );
}

export function PipelineKanban({ columns: initial }: Props) {
  const router = useRouter();
  const [columns, setColumns] = useState(initial);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setColumns(initial);
  }, [initial]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function findStageForContact(id: string): PipelineStage | null {
    for (const s of PIPELINE_STAGES) {
      if (columns[s].some((c) => c.id === id)) return s;
    }
    return null;
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const contactId = String(active.id);
    const newStage = over.id as PipelineStage;
    if (!PIPELINE_STAGES.includes(newStage)) return;
    const from = findStageForContact(contactId);
    if (!from || from === newStage) return;

    setColumns((prev) => {
      const card = prev[from].find((c) => c.id === contactId);
      if (!card) return prev;
      const next = { ...prev };
      next[from] = next[from].filter((c) => c.id !== contactId);
      next[newStage] = [...next[newStage], card];
      return next;
    });

    const r = await updateContactPipelineStage(contactId, newStage);
    if (!r.ok) {
      setColumns(initial);
      router.refresh();
      return;
    }
    router.refresh();
  }

  const activeCard = activeId
    ? (() => {
        const st = findStageForContact(activeId);
        return st ? columns[st].find((c) => c.id === activeId) : undefined;
      })()
    : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {PIPELINE_STAGES.map((stage) => (
          <StageColumn key={stage} stage={stage}>
            {columns[stage].map((c) => (
              <KanbanCard key={c.id} card={c} />
            ))}
          </StageColumn>
        ))}
      </div>
      <DragOverlay>
        {activeCard ? (
          <div className="rounded-xl border border-amber-300 bg-white p-3 shadow-lg">
            <p className="text-sm font-semibold">{activeCard.name}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
