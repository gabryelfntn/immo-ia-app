-- Annonces générées par IA pour un bien
create table if not exists public.generated_listings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  classique text not null,
  dynamique text not null,
  premium text not null,
  created_at timestamptz default now()
);

create index if not exists generated_listings_property_id_idx
  on public.generated_listings (property_id);

create index if not exists generated_listings_agency_id_idx
  on public.generated_listings (agency_id);
