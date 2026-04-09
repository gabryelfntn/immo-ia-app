-- Ajout date de dernier contact (relances)
alter table if exists public.contacts
  add column if not exists last_contacted_at timestamptz;

create index if not exists contacts_last_contacted_at_idx
  on public.contacts (last_contacted_at desc);

-- Index utile pour filtrer par agence + inactivité
create index if not exists contacts_agency_last_contacted_at_idx
  on public.contacts (agency_id, last_contacted_at desc);

