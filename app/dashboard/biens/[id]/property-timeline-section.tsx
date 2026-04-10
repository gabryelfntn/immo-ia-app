import type { PropertyTimelineItem } from "@/lib/activity/property-timeline";

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function PropertyTimelineSection({ items }: { items: PropertyTimelineItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500">Aucun événement agrégé.</p>
    );
  }

  return (
    <ol className="relative space-y-3 border-l border-slate-200 pl-6">
      {items.map((it) => (
        <li key={it.id} className="text-sm">
          <span className="absolute -left-[5px] mt-1.5 h-2 w-2 rounded-full bg-amber-600" />
          <time className="text-xs text-slate-400">{formatWhen(it.at)}</time>
          <p className="font-medium text-slate-900">{it.title}</p>
          {it.subtitle ? (
            <p className="text-slate-600">{it.subtitle}</p>
          ) : null}
          {it.href ? (
            <a
              href={it.href}
              className="mt-1 inline-block text-xs font-medium text-amber-900 hover:underline"
            >
              Ouvrir
            </a>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
