import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScrollText } from "lucide-react";

const PAGE_SIZE = 50;

type Search = { page?: string };

type Props = { searchParams?: Promise<Search> };

export default async function AuditPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const pageNum = Math.max(1, Math.floor(Number(sp.page) || 1));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Journal d&apos;audit</h1>
        <p className="mt-2 text-sm text-slate-500">Aucune agence associée.</p>
      </div>
    );
  }

  const agencyId = profile.agency_id as string;
  const from = (pageNum - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: rows, error, count } = await supabase
    .from("audit_log")
    .select("id, actor_id, entity_type, entity_id, action, payload, created_at", {
      count: "exact",
    })
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-slate-900">Journal d&apos;audit</h1>
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error.message}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Vérifiez que la migration{" "}
          <code className="rounded bg-slate-100 px-1">20260410500000_audit_links_snooze_webhooks</code>{" "}
          est appliquée sur Supabase.
        </p>
      </div>
    );
  }

  const list = rows ?? [];
  const totalCount = count ?? list.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const actorIds = [...new Set(list.map((r) => r.actor_id as string))];
  const { data: actorRows } =
    actorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", actorIds)
      : { data: [] as { id: string; full_name: string | null }[] };

  const nameById = new Map(
    (actorRows ?? []).map((a) => [
      a.id as string,
      (a.full_name as string | null)?.trim() || null,
    ])
  );

  const buildPageHref = (p: number) =>
    p > 1 ? `/dashboard/audit?page=${p}` : "/dashboard/audit";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-600/90">
            Conformité
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-4xl font-bold tracking-tight text-slate-900">
            <ScrollText className="h-9 w-9 text-stone-600" />
            Journal d&apos;audit
          </h1>
          <p className="mt-2 text-slate-500">
            Actions sensibles enregistrées pour votre agence (création de liens,
            snooze relances, changements d&apos;étape, etc.).
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-500 hover:text-stone-800"
        >
          ← Tableau de bord
        </Link>
      </div>

      <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Utilisateur</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Cible</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {list.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                  Aucune entrée pour l&apos;instant.
                </td>
              </tr>
            ) : (
              list.map((r) => {
                const aid = r.actor_id as string;
                const who = nameById.get(aid) ?? aid.slice(0, 8) + "…";
                const payload =
                  r.payload && typeof r.payload === "object"
                    ? JSON.stringify(r.payload)
                    : "";
                return (
                  <tr key={r.id as string} className="border-t border-slate-100 align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(r.created_at as string))}
                    </td>
                    <td className="px-4 py-3 text-xs">{who}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900">
                        {r.action as string}
                      </span>
                      {payload ? (
                        <pre className="mt-1 max-h-24 max-w-[min(100%,28rem)] overflow-auto rounded bg-slate-50 p-2 text-[11px] text-slate-600">
                          {payload}
                        </pre>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="text-slate-500">{r.entity_type as string}</span>
                      <br />
                      <code className="text-[11px] text-slate-600">
                        {(r.entity_id as string).slice(0, 8)}…
                      </code>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <nav
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
          aria-label="Pagination audit"
        >
          {pageNum > 1 ? (
            <Link
              href={buildPageHref(pageNum - 1)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-stone-50"
            >
              Précédent
            </Link>
          ) : null}
          <span className="px-3 text-sm text-slate-600">
            Page {pageNum} / {totalPages} ({totalCount} entrées)
          </span>
          {pageNum < totalPages ? (
            <Link
              href={buildPageHref(pageNum + 1)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-stone-50"
            >
              Suivant
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
