import { Sparkles } from "lucide-react";

export default function AnnoncesPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30">
          <Sparkles className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400/90">
            Intelligence
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Annonces IA
          </h1>
        </div>
      </div>
      <p className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-6 text-slate-500">
        Générez des annonces depuis la fiche d&apos;un bien (
        <span className="text-violet-600">Générer une annonce IA</span>). Cette
        vue globale évoluera prochainement.
      </p>
    </div>
  );
}
