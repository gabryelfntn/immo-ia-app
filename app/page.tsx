import Link from "next/link";
import { Home as HomeIcon } from "lucide-react";
import { AppLaunchSequence } from "./_components/app-launch-sequence";

export default function Home() {
  return (
    <AppLaunchSequence>
      <div className="auth-grid-pattern flex min-h-screen flex-col items-center justify-center px-6 py-20">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-stone-600 to-stone-900 text-white shadow-xl shadow-stone-600/30">
            <HomeIcon className="h-10 w-10" strokeWidth={1.75} />
          </div>
          <h1 className="mt-8 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            ImmoAI
          </h1>
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.25em] text-stone-800">
            Suite agence immobilière
          </p>
          <p className="mx-auto mt-6 max-w-md text-slate-500">
            Pilotez vos biens, contacts et annonces générées par l&apos;IA — interface
            épurée, fluide et professionnelle.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="btn-luxury-primary inline-flex min-w-[200px] items-center justify-center rounded-2xl px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300"
            >
              <span className="relative z-10">Connexion</span>
            </Link>
            <Link
              href="/register"
              className="inline-flex min-w-[200px] items-center justify-center rounded-2xl border border-slate-200/90 bg-white px-8 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:border-stone-400/50 hover:bg-stone-50"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </AppLaunchSequence>
  );
}
