import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PropertyForm } from "./property-form";

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-3xl pb-12">
      <Link
        href="/dashboard/biens"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-all duration-300 hover:text-stone-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux biens
      </Link>
      <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900">
        Ajouter un bien
      </h1>
      <p className="mt-3 text-slate-500">
        Le statut sera « Disponible » par défaut. Les photos sont envoyées après la
        création du bien (bucket Supabase{" "}
        <span className="font-mono text-stone-800">property-photos</span>).
      </p>
      <PropertyForm />
    </div>
  );
}
