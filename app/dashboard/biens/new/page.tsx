import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PropertyForm } from "./property-form";

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-3xl pb-12">
      <Link
        href="/dashboard/biens"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-all duration-300 hover:text-violet-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux biens
      </Link>
      <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-50">
        Ajouter un bien
      </h1>
      <p className="mt-3 text-zinc-500">
        Le statut sera « Disponible » par défaut. Les photos sont envoyées après la
        création du bien (bucket Supabase{" "}
        <span className="font-mono text-violet-600">property-photos</span>).
      </p>
      <PropertyForm />
    </div>
  );
}
