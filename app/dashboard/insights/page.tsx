import { InsightsClient } from "./insights-client";

export default function InsightsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Indicateurs (IA)</h1>
      <p className="mt-2 text-sm text-slate-600">
        Questions en langage naturel : l’IA choisit une métrique sûre, les
        chiffres viennent de ta base.
      </p>
      <div className="mt-8">
        <InsightsClient />
      </div>
    </div>
  );
}
