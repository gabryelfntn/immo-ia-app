-- Notifications in-app, préférences push digest, veille biens, champs conformité mandat/DPE

-- --- Champs conformité (biens) ---
alter table public.properties
  add column if not exists energy_rating text,
  add column if not exists diagnostics_valid_until date,
  add column if not exists mandate_expires_at date;

comment on column public.properties.energy_rating is 'Classe énergie affichée (ex. A–G), à titre indicatif.';
comment on column public.properties.diagnostics_valid_until is 'Fin de validité des diagnostics (à titre indicatif).';
comment on column public.properties.mandate_expires_at is 'Fin de mandat (à titre indicatif).';

-- --- Notifications in-app ---
create table if not exists public.in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'info',
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists in_app_notifications_user_created_idx
  on public.in_app_notifications (user_id, created_at desc);

alter table public.in_app_notifications enable row level security;

drop policy if exists "in_app_notifications_select_own" on public.in_app_notifications;
create policy "in_app_notifications_select_own"
  on public.in_app_notifications
  for select
  to authenticated
  using (
    user_id = auth.uid()
    and agency_id = public.auth_user_agency_id()
  );

drop policy if exists "in_app_notifications_insert_self" on public.in_app_notifications;
create policy "in_app_notifications_insert_self"
  on public.in_app_notifications
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and agency_id = public.auth_user_agency_id()
  );

drop policy if exists "in_app_notifications_update_own" on public.in_app_notifications;
create policy "in_app_notifications_update_own"
  on public.in_app_notifications
  for update
  to authenticated
  using (
    user_id = auth.uid()
    and agency_id = public.auth_user_agency_id()
  )
  with check (
    user_id = auth.uid()
    and agency_id = public.auth_user_agency_id()
  );

-- --- Préférences notifications / digest push ---
create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  push_digest_hour_utc smallint not null default 7
    check (push_digest_hour_utc >= 0 and push_digest_hour_utc <= 23),
  push_mute_weekends boolean not null default false,
  updated_at timestamptz default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
create policy "notification_preferences_select_own"
  on public.notification_preferences
  for select
  to authenticated
  using (
    user_id = auth.uid()
    and agency_id = public.auth_user_agency_id()
  );

drop policy if exists "notification_preferences_upsert_own" on public.notification_preferences;
create policy "notification_preferences_upsert_own"
  on public.notification_preferences
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and agency_id = public.auth_user_agency_id()
  );

drop policy if exists "notification_preferences_update_own" on public.notification_preferences;
create policy "notification_preferences_update_own"
  on public.notification_preferences
  for update
  to authenticated
  using (
    user_id = auth.uid()
    and agency_id = public.auth_user_agency_id()
  )
  with check (
    user_id = auth.uid()
    and agency_id = public.auth_user_agency_id()
  );

-- --- Veille / recherches enregistrées ---
create table if not exists public.saved_property_searches (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  agent_id uuid not null references public.profiles (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  name text not null,
  city_query text,
  transaction text,
  type_query text,
  price_max numeric,
  created_at timestamptz default now()
);

create index if not exists saved_property_searches_agent_idx
  on public.saved_property_searches (agent_id, created_at desc);

alter table public.saved_property_searches enable row level security;

drop policy if exists "saved_property_searches_select_agency" on public.saved_property_searches;
create policy "saved_property_searches_select_agency"
  on public.saved_property_searches
  for select
  to authenticated
  using (agency_id = public.auth_user_agency_id());

drop policy if exists "saved_property_searches_insert_agency" on public.saved_property_searches;
create policy "saved_property_searches_insert_agency"
  on public.saved_property_searches
  for insert
  to authenticated
  with check (
    agency_id = public.auth_user_agency_id()
    and agent_id = auth.uid()
  );

drop policy if exists "saved_property_searches_update_own" on public.saved_property_searches;
create policy "saved_property_searches_update_own"
  on public.saved_property_searches
  for update
  to authenticated
  using (
    agency_id = public.auth_user_agency_id()
    and agent_id = auth.uid()
  )
  with check (
    agency_id = public.auth_user_agency_id()
    and agent_id = auth.uid()
  );

drop policy if exists "saved_property_searches_delete_own" on public.saved_property_searches;
create policy "saved_property_searches_delete_own"
  on public.saved_property_searches
  for delete
  to authenticated
  using (
    agency_id = public.auth_user_agency_id()
    and agent_id = auth.uid()
  );
