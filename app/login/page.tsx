"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Home } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.refresh();
    router.push(next);
  }

  const inputClass = "input-app";

  return (
    <div className="relative w-full max-w-md rounded-3xl border border-gray-200/90 bg-white p-8 shadow-[0_24px_64px_-28px_rgba(15,23,42,0.18)]">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/35">
          <Home className="h-8 w-8" strokeWidth={1.75} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">ImmoAI</h1>
        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">
          Suite agence
        </p>
        <p className="mt-6 text-sm text-gray-600">
          Connectez-vous à votre espace agence
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@agence.fr"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="btn-luxury-primary relative mt-2 w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed"
        >
          <span className="relative z-10">
            {loading ? "Connexion…" : "Se connecter"}
          </span>
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600">
        Pas encore de compte ?{" "}
        <Link
          href="/register"
          className="font-semibold text-violet-600 transition-colors hover:text-fuchsia-600"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="auth-grid-pattern flex min-h-screen items-center justify-center">
      <div className="h-12 w-12 animate-pulse rounded-2xl bg-violet-200/60" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="auth-grid-pattern flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
