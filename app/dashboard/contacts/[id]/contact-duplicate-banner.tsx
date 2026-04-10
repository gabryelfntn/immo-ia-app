import Link from "next/link";

export type DuplicateRow = { id: string; first_name: string; last_name: string };

export function ContactDuplicateBanner({
  duplicates,
}: {
  duplicates: DuplicateRow[];
}) {
  if (!duplicates.length) return null;

  return (
    <div className="rounded-2xl border border-amber-300/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
      <p className="font-semibold">Possible doublon dans votre base</p>
      <p className="mt-1 text-amber-900/90">
        {duplicates.length} autre{duplicates.length > 1 ? "s" : ""} contact
        {duplicates.length > 1 ? "s" : ""} partage
        {duplicates.length > 1 ? "nt" : ""} le même e-mail ou téléphone.
      </p>
      <ul className="mt-2 space-y-1">
        {duplicates.map((d) => (
          <li key={d.id}>
            <Link
              href={`/dashboard/contacts/${d.id}`}
              className="font-medium text-amber-950 underline hover:no-underline"
            >
              {d.first_name} {d.last_name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
