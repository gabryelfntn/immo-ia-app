create table if not exists public.property_photos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  url text not null,
  is_main boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists property_photos_property_id_idx on public.property_photos (property_id);

-- Activer RLS et ajouter des politiques adaptées à votre app (lecture/écriture par agency via join sur properties).
