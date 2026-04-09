-- Comptes-rendus de visite générés par IA
create table if not exists public.visit_reports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  agent_id uuid not null references public.profiles (id) on delete cascade,
  visit_date date not null,
  raw_notes text not null,
  summary text not null,
  positive_points jsonb not null default '[]'::jsonb,
  negative_points jsonb not null default '[]'::jsonb,
  client_interest text not null,
  recommendation text not null,
  next_step text not null,
  created_at timestamptz default now(),
  constraint visit_reports_client_interest_check check (
    client_interest in ('fort', 'moyen', 'faible')
  )
);

create index if not exists visit_reports_agency_id_idx
  on public.visit_reports (agency_id);

create index if not exists visit_reports_property_id_idx
  on public.visit_reports (property_id);

create index if not exists visit_reports_contact_id_idx
  on public.visit_reports (contact_id);

create index if not exists visit_reports_visit_date_idx
  on public.visit_reports (visit_date desc);
