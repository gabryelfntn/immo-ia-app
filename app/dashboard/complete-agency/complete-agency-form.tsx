"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { completeRegistration } from "@/app/register/actions";

type Props = {
  defaultEmail: string;
};

export function CompleteAgencyForm({ defaultEmail }: Props) {
  const router = useRouter();
  const [agencyName, setAgencyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await completeRegistration({
      agencyName,
      fullName,
      email: defaultEmail,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-stone-200/90 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Lier ton agence
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Ton compte existe mais n’est pas rattaché à une agence dans l’app. Crée
        l’agence ici (ou complète les champs si tu reprends une inscription
        interrompue).
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Nom de l’agence
          </label>
          <input
            className="input-app w-full"
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            required
            autoComplete="organization"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Ton nom
          </label>
          <input
            className="input-app w-full"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
        >
          {loading ? "Enregistrement…" : "Enregistrer et continuer"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/dashboard" className="font-medium text-stone-700 hover:underline">
          Retour au tableau de bord
        </Link>
      </p>
    </div>
  );
}
