import Link from "next/link";
import { Home as HomeIcon } from "lucide-react";

export default function Home() {
  return (
    <div className="auth-grid-pattern flex min-h-screen flex-col items-center justify-center px-6 py-20">
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/40">
          <HomeIcon className="h-10 w-10" strokeWidth={1.75} />
        </div>
        <h1 className="mt-8 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          ImmoAI
        </h1>
        <p className="mt-3 text-sm font-medium uppercase tracking-[0.3em] text-amber-500/90">
          Luxury real estate tech
        </p>
        <p className="mx-auto mt-6 max-w-md text-zinc-400">
          La suite pour piloter vos biens, contacts et annonces générées par
          l&apos;IA.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/login"
            className="btn-luxury-primary inline-flex min-w-[200px] items-center justify-center rounded-xl px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300"
          >
            <span className="relative z-10">Connexion</span>
          </Link>
          <Link
            href="/register"
            className="inline-flex min-w-[200px] items-center justify-center rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-semibold text-zinc-200 backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/40 hover:bg-white/[0.08]"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
