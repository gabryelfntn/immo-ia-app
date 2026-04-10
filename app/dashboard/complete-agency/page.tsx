import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompleteAgencyForm } from "./complete-agency-form";

export default async function CompleteAgencyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/complete-agency");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.agency_id) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-3xl py-10">
      <CompleteAgencyForm defaultEmail={user.email ?? ""} />
      <p className="mx-auto mt-8 max-w-md text-center text-xs text-slate-500">
        Si tes données sont déjà dans Supabase sous une autre agence, ne crée pas
        une nouvelle agence ici : mets plutôt à jour{" "}
        <code className="rounded bg-slate-100 px-1">profiles.agency_id</code> dans
        le SQL Editor pour pointer vers l’UUID existant (
        <Link href="/dashboard" className="text-stone-700 underline">
          voir message sur le tableau de bord
        </Link>
        ).
      </p>
    </div>
  );
}
