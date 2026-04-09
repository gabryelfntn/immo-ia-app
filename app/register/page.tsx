"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Home } from "lucide-react";
import { completeRegistration } from "./actions";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();

  const [agencyName, setAgencyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          agency_name: agencyName.trim(),
        },
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    if (!data.session) {
      setLoading(false);
      setInfo(
        "Compte créé. Si la confirmation par email est activée, cliquez sur le lien reçu ; vous pourrez ensuite compléter votre agence après connexion."
      );
      return;
    }

    const result = await completeRegistration({
      agencyName,
      fullName,
      email: email.trim(),
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.refresh();
    router.push("/dashboard");
  }

  const inputClass = "input-app";

  return (
    <div className="auth-grid-pattern flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="relative w-full max-w-md rounded-3xl border border-gray-200/90 bg-white p-8 shadow-[0_24px_64px_-28px_rgba(15,23,42,0.18)]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/35">
            <Home className="h-8 w-8" strokeWidth={1.75} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">ImmoAI</h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">
            Créer votre agence
          </p>
          <p className="mt-6 text-sm text-gray-600">
            Compte administrateur et espace agence
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="agency"
              className="text-xs font-semibold uppercase tracking-wider text-gray-500"
            >
              Nom de l&apos;agence
            </label>
            <input
              id="agency"
              name="agency"
              type="text"
              required
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="fullName"
              className="text-xs font-semibold uppercase tracking-wider text-gray-500"
            >
              Nom complet
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-wider text-gray-500"
            >
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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <p className="text-xs text-gray-500">Au moins 8 caractères</p>
          </div>

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {info}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="btn-luxury-primary relative mt-2 w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed"
          >
            <span className="relative z-10">
              {loading ? "Création…" : "Créer mon compte"}
            </span>
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600">
          Déjà inscrit ?{" "}
          <Link
            href="/login"
            className="font-semibold text-violet-600 transition-colors hover:text-fuchsia-600"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
