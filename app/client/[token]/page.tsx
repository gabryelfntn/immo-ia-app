import { loadClientPortalData } from "@/lib/client-portal/load-portal-data";
import { FileText, Home, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ token: string }> };

function formatVisitDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
      new Date(iso + "T12:00:00")
    );
  } catch {
    return iso;
  }
}

export default async function ClientPortalPage({ params }: Props) {
  const { token } = await params;
  if (!token?.trim()) {
    notFound();
  }

  const data = await loadClientPortalData(token);

  if (!data.ok) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <h1 className="text-lg font-bold text-stone-900">Espace client</h1>
          <p className="mt-3 text-sm text-stone-600">{data.error}</p>
          <p className="mt-6 text-xs text-stone-400">
            Contactez votre agence pour obtenir un nouveau lien sécurisé.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-10 flex items-start gap-4 border-b border-stone-200 pb-8">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-800 to-stone-900 text-white shadow-md">
          <Home className="h-6 w-6" strokeWidth={1.65} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">
            Espace personnel
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
            Bonjour, {data.firstName}
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Suivez l’avancement de votre recherche avec votre agence.
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
          Statut du dossier
        </h2>
        <p className="mt-2 text-lg font-semibold text-stone-900">
          {data.journeyLabel}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          {data.journeyDetail}
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-stone-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
            Biens proposés
          </h2>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          Sélection mise à jour par votre conseiller (périmètre des biens
          disponibles de l’agence).
        </p>
        {data.proposed.length === 0 ? (
          <p className="mt-6 text-center text-sm text-stone-500">
            Aucune sélection publiée pour l’instant. Votre conseiller peut
            synchroniser les biens depuis le CRM après une analyse.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {data.proposed.map((m) => (
              <li
                key={m.propertyId}
                className="rounded-xl border border-stone-100 bg-stone-50/80 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-stone-900">
                      {m.property.title}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">
                      {m.property.priceLabel} · {m.property.surface} m² ·{" "}
                      {m.property.city}
                    </p>
                  </div>
                  <span className="rounded-lg bg-white px-3 py-1 text-sm font-bold tabular-nums text-stone-800 ring-1 ring-stone-200">
                    {m.score}%
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">
                  <span className="font-medium text-stone-800">
                    Pourquoi ce bien :
                  </span>{" "}
                  {m.reason}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-stone-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
            Visites passées (comptes-rendus)
          </h2>
        </div>
        {data.visits.length === 0 ? (
          <p className="mt-6 text-center text-sm text-stone-500">
            Aucun compte-rendu de visite enregistré pour le moment.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {data.visits.map((v) => (
              <li
                key={v.id}
                className="rounded-xl border border-stone-100 bg-stone-50/80 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  {formatVisitDate(v.visit_date)}
                </p>
                <p className="mt-1 font-medium text-stone-900">
                  {[v.property_title, v.property_city].filter(Boolean).join(" · ") ||
                    "Bien visité"}
                </p>
                <p className="mt-2 line-clamp-4 text-sm text-stone-600">
                  {v.summary}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-stone-100/50 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
          Documents
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Aucun document n’est disponible en ligne pour le moment. Votre
          conseiller peut vous les transmettre directement (offres, diagnostics,
          etc.).
        </p>
      </section>

      <p className="mt-10 text-center text-xs text-stone-400">
        Espace sécurisé — ne partagez pas le lien de cette page.
      </p>
    </div>
  );
}
