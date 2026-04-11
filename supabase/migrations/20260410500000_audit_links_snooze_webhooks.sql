-- Journal d'audit, liens contact↔bien, snooze relances, webhooks (stub)

-- Snooze manuel des suggestions de relance (page Ma journée)
alter table public.contacts
  add column if not exists relance_snooze_until timestamptz;

create index if not exists contacts_relance_snooze_idx
  on public.contacts (agency_id, relance_snooze_until)
  where relance_snooze_until is not null;

-- Journal d'audit (actions sensibles)
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_agency_created_idx
  on public.audit_log (agency_id, created_at desc);

alter table public.audit_log enable row level security;

drop policy if exists "audit_log_select_agency" on public.audit_log;
create policy "audit_log_select_agency"
  on public.audit_log
  for select
  to authenticated
  using (agency_id = public.auth_user_agency_id());

drop policy if exists "audit_log_insert_self" on public.audit_log;
create policy "audit_log_insert_self"
  on public.audit_log
  for insert
  to authenticated
  with check (
    actor_id = auth.uid()
    and agency_id = public.auth_user_agency_id()
  );

-- Liens explicites contact ↔ bien
create table if not exists public.contact_property_links (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  agent_id uuid not null references public.profiles (id) on delete cascade,
  link_type text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint contact_property_links_type_check check (
    link_type in ('favori', 'visite_prevue', 'offre', 'autre')
  ),
  constraint contact_property_links_unique unique (contact_id, property_id, link_type)
);

create index if not exists contact_property_links_contact_idx
  on public.contact_property_links (contact_id, created_at desc);
create index if not exists contact_property_links_property_idx
  on public.contact_property_links (property_id, created_at desc);

alter table public.contact_property_links enable row level security;

drop policy if exists "contact_property_links_select_agency" on public.contact_property_links;
create policy "contact_property_links_select_agency"
  on public.contact_property_links
  for select
  to authenticated
  using (agency_id = public.auth_user_agency_id());

drop policy if exists "contact_property_links_insert_agency" on public.contact_property_links;
create policy "contact_property_links_insert_agency"
  on public.contact_property_links
  for insert
  to authenticated
  with check (agency_id = public.auth_user_agency_id());

drop policy if exists "contact_property_links_delete_agency" on public.contact_property_links;
create policy "contact_property_links_delete_agency"
  on public.contact_property_links
  for delete
  to authenticated
  using (agency_id = public.auth_user_agency_id());

-- Webhooks sortants (enregistrement URL — déclenchement à brancher plus tard)
create table if not exists public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete set null,
  url text not null,
  events text[] not null default '{}',
  secret text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.webhook_endpoints enable row level security;

drop policy if exists "webhook_endpoints_select_agency" on public.webhook_endpoints;
create policy "webhook_endpoints_select_agency"
  on public.webhook_endpoints
  for select
  to authenticated
  using (agency_id = public.auth_user_agency_id());

drop policy if exists "webhook_endpoints_insert_leads" on public.webhook_endpoints;
create policy "webhook_endpoints_insert_leads"
  on public.webhook_endpoints
  for insert
  to authenticated
  with check (
    agency_id = public.auth_user_agency_id()
    and created_by = auth.uid()
  );

drop policy if exists "webhook_endpoints_delete_leads" on public.webhook_endpoints;
create policy "webhook_endpoints_delete_leads"
  on public.webhook_endpoints
  for delete
  to authenticated
  using (agency_id = public.auth_user_agency_id());
