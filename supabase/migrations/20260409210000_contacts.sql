-- Contacts CRM par agence
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  agent_id uuid not null references public.profiles (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  type text not null,
  status text not null default 'froid',
  budget_min numeric,
  budget_max numeric,
  desired_city text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint contacts_type_check check (
    type in ('prospect', 'acheteur', 'vendeur', 'locataire', 'proprietaire')
  ),
  constraint contacts_status_check check (
    status in ('froid', 'tiede', 'chaud', 'client')
  )
);

create index if not exists contacts_agency_id_idx on public.contacts (agency_id);
