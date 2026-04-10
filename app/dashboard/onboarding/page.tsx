import Link from "next/link";
import { Rocket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingClient } from "./onboarding-client";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] ?? "Bienvenue";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-800 text-white shadow-lg shadow-orange-700/25">
          <Rocket className="h-6 w-6" strokeWidth={1.65} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-600/90">
            Premiers pas
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {firstName}, démarrez avec ImmoAI
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Quelques étapes pour être opérationnel rapidement. Les conseils IA
            personnalisés utilisent le contexte de votre agence.
          </p>
        </div>
      </div>

      {!profile?.agency_id ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-stone-800">
          Complétez d’abord votre{" "}
          <Link href="/dashboard/complete-agency" className="font-semibold underline">
            fiche agence
          </Link>
          .
        </p>
      ) : null}

      <ol className="mt-8 space-y-4 text-sm text-stone-800">
        <li className="flex gap-3 rounded-xl border border-stone-200/90 bg-white p-4 shadow-sm">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">
            1
          </span>
          <div>
            <p className="font-semibold">Structurez votre base</p>
            <p className="mt-1 text-stone-600">
              Ajoutez vos{" "}
              <Link href="/dashboard/biens" className="font-medium underline">
                biens
              </Link>{" "}
              et vos{" "}
              <Link href="/dashboard/contacts" className="font-medium underline">
                contacts
              </Link>{" "}
              pour alimenter relances et matching.
            </p>
          </div>
        </li>
        <li className="flex gap-3 rounded-xl border border-stone-200/90 bg-white p-4 shadow-sm">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">
            2
          </span>
          <div>
            <p className="font-semibold">Activez l’IA au quotidien</p>
            <p className="mt-1 text-stone-600">
              <Link href="/dashboard/outils-ia" className="font-medium underline">
                Outils IA
              </Link>{" "}
              (chat, dictée, analyse de texte) et{" "}
              <Link href="/dashboard/annonces" className="font-medium underline">
                annonces
              </Link>{" "}
              depuis une fiche bien.
            </p>
          </div>
        </li>
        <li className="flex gap-3 rounded-xl border border-stone-200/90 bg-white p-4 shadow-sm">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">
            3
          </span>
          <div>
            <p className="font-semibold">Cadencez le suivi</p>
            <p className="mt-1 text-stone-600">
              Utilisez{" "}
              <Link href="/dashboard/relances" className="font-medium underline">
                Relances
              </Link>
              ,{" "}
              <Link href="/dashboard/visites" className="font-medium underline">
                Visites
              </Link>{" "}
              et la{" "}
              <Link href="/dashboard/journee" className="font-medium underline">
                journée
              </Link>{" "}
              pour ne rien laisser passer.
            </p>
          </div>
        </li>
      </ol>

      {profile?.agency_id ? <OnboardingClient /> : null}
    </div>
  );
}
