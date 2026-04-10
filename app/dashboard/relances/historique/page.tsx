import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { History, Mail } from "lucide-react";
import { currentMonthRangeISO } from "@/lib/dashboard/time";
import { RelancesSubnav } from "../_components/relances-subnav";
import { ExportFollowupsButton } from "../_components/export-followups-button";

type FollowupRow = {
  id: string;
  created_at: string;
  status: string;
  subject: string;
  tone: string | null;
  error: string | null;
  body: string;
  contact_id: string;
  contacts: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
};

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusBadge(status: string): string {
  if (status === "sent") {
    return "border-emerald-500/35 bg-emerald-500/12 text-emerald-200 shadow-[0_0_16px_-8px_rgba(52,211,153,0.35)]";
  }
  return "border-rose-500/35 bg-rose-500/10 text-rose-200";
}

type HistoriqueSearch = { fe?: string };

export default async function RelancesHistoriquePage({
  searchParams,
}: {
  searchParams?: Promise<HistoriqueSearch>;
}) {
  const sp = (await searchParams) ?? {};
  const feRaw = sp.fe?.trim() ?? "";
  const feUuid =
    feRaw && /^[0-9a-f-]{36}$/i.test(feRaw) ? feRaw : "";

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
        <h1 className="text-3xl font-bold text-slate-900">Historique</h1>
        <p className="mt-2 text-sm text-slate-500">
          Aucune agence associée à votre compte.
        </p>
      </div>
    );
  }

  const agencyId = profile.agency_id as string;
  const cur = currentMonthRangeISO();

  let listQuery = supabase
    .from("followup_emails")
    .select(
      `
      id,
      created_at,
      status,
      subject,
      tone,
      error,
      body,
      contact_id,
      contacts ( first_name, last_name, email )
    `
    )
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });

  if (feUuid) {
    listQuery = listQuery.eq("id", feUuid).limit(5);
  } else {
    listQuery = listQuery.limit(150);
  }

  const [
    listRes,
    sentTotalRes,
    failedTotalRes,
    sentMonthRes,
    failedMonthRes,
  ] = await Promise.all([
    listQuery,
    supabase
      .from("followup_emails")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .eq("status", "sent"),
    supabase
      .from("followup_emails")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .eq("status", "failed"),
    supabase
      .from("followup_emails")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .eq("status", "sent")
      .gte("created_at", cur.start)
      .lte("created_at", cur.end),
    supabase
      .from("followup_emails")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .eq("status", "failed")
      .gte("created_at", cur.start)
      .lte("created_at", cur.end),
  ]);

  const { data: rows, error } = listRes;

  if (error) {
    return (
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-slate-900">Historique des relances</h1>
        <p className="mt-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error.message}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Vérifiez que la table{" "}
          <code className="rounded bg-white/[0.06] px-1">followup_emails</code> existe
          et que les migrations relances sont appliquées.
        </p>
      </div>
    );
  }

  const list = (rows ?? []) as unknown as FollowupRow[];
  const sentTotal = sentTotalRes.count ?? 0;
  const failedTotal = failedTotalRes.count ?? 0;
  const sentMonth = sentMonthRes.count ?? 0;
  const failedMonth = failedMonthRes.count ?? 0;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500/90">
            CRM
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
            Historique des relances
          </h1>
          <p className="mt-2 text-slate-500">
            Emails automatiques enregistrés pour votre agence ({list.length}{" "}
            entrée{list.length !== 1 ? "s" : ""} affichée
            {list.length !== 1 ? "s" : ""} ci-dessous, export jusqu’à 5&nbsp;000).
          </p>
        </div>
        <ExportFollowupsButton />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Envoyés (total)
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
            {sentTotal}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Échecs (total)
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-rose-400">
            {failedTotal}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Envoyés ce mois
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-400">
            {sentMonth}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Échecs ce mois
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-rose-400">
            {failedMonth}
          </p>
        </div>
      </div>

      <RelancesSubnav current="historique" />

      {feUuid ? (
        <div className="mt-4">
          <Link
            href="/dashboard/relances/historique"
            className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
          >
            ← Voir tout l’historique des relances
          </Link>
        </div>
      ) : null}

      {list.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-white/[0.03] px-8 py-20 text-center">
          <History className="mb-4 h-12 w-12 text-slate-600" />
          <p className="text-xl font-semibold text-slate-700">
            Aucun envoi enregistré
          </p>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Les prochains emails générés par l&apos;automatisation apparaîtront ici.
          </p>
        </div>
      ) : (
        <ul className="mt-10 flex flex-col gap-4">
          {list.map((r) => {
            const c = r.contacts;
            const name = c
              ? `${c.first_name} ${c.last_name}`.trim()
              : "Contact";
            const email = c?.email ?? "—";
            return (
              <li key={r.id}>
                <article className="card-luxury rounded-2xl border border-slate-200/90 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-stone-400/20 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusBadge(r.status)}`}
                        >
                          {r.status === "sent" ? "Envoyé" : "Échec"}
                        </span>
                        <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                          <Mail className="h-4 w-4 text-stone-700" />
                          {formatDateTime(r.created_at)}
                        </span>
                        {r.tone ? (
                          <span className="text-xs font-medium text-slate-500">
                            Ton : {r.tone}
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-3 text-lg font-bold text-slate-900">
                        {r.subject}
                      </h2>
                      <p className="mt-2 text-sm text-stone-800">
                        <Link
                          href={`/dashboard/contacts/${r.contact_id}`}
                          className="transition-colors hover:text-amber-300"
                        >
                          {name}
                        </Link>
                        <span className="text-slate-600"> · </span>
                        <span className="text-slate-500">{email}</span>
                      </p>
                      {r.status === "failed" && r.error ? (
                        <p className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-sm text-rose-300">
                          {r.error}
                        </p>
                      ) : null}
                      {r.body?.trim() ? (
                        <details className="mt-4 group">
                          <summary className="cursor-pointer text-sm font-semibold text-amber-500/90 transition-colors hover:text-amber-400">
                            Voir le corps de l&apos;email
                          </summary>
                          <div className="mt-3 whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-100 p-4 text-sm leading-relaxed text-slate-500">
                            {r.body}
                          </div>
                        </details>
                      ) : null}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
