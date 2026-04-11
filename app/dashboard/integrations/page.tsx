import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Plug } from "lucide-react";
import { addWebhookEndpoint, deleteWebhookEndpoint } from "./actions";

export default async function IntegrationsPage() {
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
        <h1 className="text-3xl font-bold text-slate-900">Intégrations</h1>
        <p className="mt-2 text-sm text-slate-500">Aucune agence associée.</p>
      </div>
    );
  }

  const agencyId = profile.agency_id as string;

  const { data: hooks, error } = await supabase
    .from("webhook_endpoints")
    .select("id, url, events, is_active, created_at")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-600/90">
            Automatisation
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-4xl font-bold tracking-tight text-slate-900">
            <Plug className="h-9 w-9 text-stone-600" />
            Webhooks
          </h1>
          <p className="mt-2 text-slate-500">
            Enregistrez des URL HTTPS pour des intégrations futures (événements
            côté serveur à brancher ensuite).
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-500 hover:text-stone-800"
        >
          ← Tableau de bord
        </Link>
      </div>

      {error ? (
        <p className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error.message}
        </p>
      ) : null}

      <section className="mt-10 rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
        <h2 className="text-sm font-bold text-slate-900">Nouveau webhook</h2>
        <p className="mt-1 text-xs text-slate-500">
          URL complète en HTTPS. Événements optionnels, séparés par des virgules
          (ex. <code className="rounded bg-slate-100 px-1">contact.created</code>
          ).
        </p>
        <form action={addWebhookEndpoint} className="mt-4 space-y-3">
          <label className="block text-xs font-semibold text-slate-600">
            URL
            <input
              name="url"
              type="url"
              required
              placeholder="https://example.com/hook"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Événements (optionnel)
            <input
              name="events"
              type="text"
              placeholder="contact.created, visit.completed"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-900"
          >
            Enregistrer
          </button>
        </form>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
        <h2 className="text-sm font-bold text-slate-900">Webhooks enregistrés</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {(hooks ?? []).length === 0 ? (
            <li className="text-slate-500">Aucun pour l&apos;instant.</li>
          ) : (
            (hooks ?? []).map((h) => (
              <li
                key={h.id as string}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="break-all font-mono text-xs text-slate-800">
                    {h.url as string}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {(h.events as string[])?.length
                      ? (h.events as string[]).join(", ")
                      : "Aucun événement listé"}
                    {" · "}
                    {h.is_active ? "actif" : "inactif"}
                  </p>
                </div>
                <form action={deleteWebhookEndpoint}>
                  <input type="hidden" name="id" value={h.id as string} />
                  <button
                    type="submit"
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    Supprimer
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
