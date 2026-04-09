import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  PROPERTY_TYPE_LABELS,
  TRANSACTION_LABELS,
  formatPriceEUR,
} from "@/lib/properties/labels";
import type { PropertyType } from "@/lib/properties/schema";
import {
  AnnonceClient,
  type GeneratedListingRow,
} from "./annonce-client";

type Props = { params: Promise<{ id: string }> };

export default async function AnnonceIAPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-zinc-400">Aucune agence associée.</p>
      </div>
    );
  }

  const { data: row, error: rowError } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("agency_id", profile.agency_id)
    .maybeSingle();

  if (rowError || !row) {
    notFound();
  }

  const ptype = row.type as PropertyType;
  const transaction = row.transaction as "vente" | "location";

  const header = {
    title: row.title as string,
    typeLabel: PROPERTY_TYPE_LABELS[ptype],
    transactionLabel: TRANSACTION_LABELS[transaction],
    priceLabel: formatPriceEUR(Number(row.price), transaction),
    surface: String(row.surface),
    rooms: Number(row.rooms),
    bedrooms: Number(row.bedrooms),
    city: row.city as string,
    zip_code: row.zip_code as string,
    address: row.address as string,
  };

  const { data: generated, error: genError } = await supabase
    .from("generated_listings")
    .select("id, classique, dynamique, premium, created_at")
    .eq("property_id", id)
    .eq("agency_id", profile.agency_id)
    .order("created_at", { ascending: false });

  if (genError) {
    return (
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/dashboard/biens/${id}`}
          className="text-sm font-medium text-zinc-400 transition-all duration-300 hover:text-violet-300"
        >
          ← Retour au bien
        </Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-50">
          Générer une annonce IA
        </h1>
        <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {genError.message}
        </p>
        <p className="mt-3 text-xs text-zinc-500">
          Créez la table{" "}
          <code className="rounded bg-white/[0.06] px-1">generated_listings</code>{" "}
          (migration{" "}
          <code className="rounded bg-white/[0.06] px-1">
            20260409220000_generated_listings
          </code>
          ).
        </p>
      </div>
    );
  }

  const listings = (generated ?? []) as GeneratedListingRow[];

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href={`/dashboard/biens/${id}`}
        className="text-sm font-medium text-zinc-400 transition-all duration-300 hover:text-violet-300"
      >
        ← Retour au bien
      </Link>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-violet-400/90">
        Intelligence créative
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-50">
        Générer une annonce IA
      </h1>
      <p className="mt-3 text-zinc-500">
        {header.title} · {header.city}
      </p>

      <div className="mt-10">
        <AnnonceClient propertyId={id} header={header} listings={listings} />
      </div>
    </div>
  );
}
