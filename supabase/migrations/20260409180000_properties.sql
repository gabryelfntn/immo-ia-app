-- Table des biens (à appliquer si la table n'existe pas encore)
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  agent_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  transaction text not null,
  title text not null,
  price numeric not null,
  surface numeric not null,
  rooms integer not null,
  bedrooms integer not null,
  address text not null,
  city text not null,
  zip_code text not null,
  description text,
  status text not null default 'disponible',
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint properties_type_check check (
    type in ('appartement', 'maison', 'terrain', 'commerce', 'bureau')
  ),
  constraint properties_transaction_check check (transaction in ('vente', 'location')),
  constraint properties_status_check check (
    status in ('disponible', 'sous_compromis', 'vendu', 'loue')
  )
);

create index if not exists properties_agency_id_idx on public.properties (agency_id);
