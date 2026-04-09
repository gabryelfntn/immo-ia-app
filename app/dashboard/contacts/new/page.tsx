import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ContactForm } from "./contact-form";

export default function NewContactPage() {
  return (
    <div className="mx-auto max-w-3xl pb-12">
      <Link
        href="/dashboard/contacts"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-all duration-300 hover:text-indigo-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux contacts
      </Link>
      <h1 className="mt-6 text-4xl font-bold tracking-tight text-white">
        Ajouter un contact
      </h1>
      <p className="mt-3 text-zinc-500">
        Les champs budget et ville recherchée sont optionnels.
      </p>
      <ContactForm />
    </div>
  );
}
