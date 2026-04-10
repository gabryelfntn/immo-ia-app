-- Champs CRM additionnels, historique prix, checklist mandat

alter table public.contacts
  add column if not exists source text,
  add column if not exists next_action_at timestamptz,
  add column if not exists next_action_label text,
  add column if not exists coordinates_verified_at timestamptz;

create index if not exists contacts_next_action_at_idx
  on public.contacts (agency_id, next_action_at)
  where next_action_at is not null;

alter table public.properties
  add column if not exists listing_url text,
  add column if not exists mandate_checklist jsonb not null default '{}'::jsonb;

create table if not exists public.property_price_history (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  price numeric not null,
  recorded_at timestamptz not null default now(),
  recorded_by uuid references public.profiles (id) on delete set null
);

create index if not exists property_price_history_property_idx
  on public.property_price_history (property_id, recorded_at desc);

alter table public.property_price_history enable row level security;

drop policy if exists "property_price_history_select_agency" on public.property_price_history;
create policy "property_price_history_select_agency"
  on public.property_price_history
  for select
  to authenticated
  using (
    agency_id = (
      select p.agency_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "property_price_history_insert_agency" on public.property_price_history;
create policy "property_price_history_insert_agency"
  on public.property_price_history
  for insert
  to authenticated
  with check (
    agency_id = (
      select p.agency_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "property_price_history_delete_agency" on public.property_price_history;
create policy "property_price_history_delete_agency"
  on public.property_price_history
  for delete
  to authenticated
  using (
    agency_id = (
      select p.agency_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );
