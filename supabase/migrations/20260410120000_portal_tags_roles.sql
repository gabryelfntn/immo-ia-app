-- Portail client, tags contacts, contrainte rôle profil

-- ---------------------------------------------------------------------------
-- Rôles profil (extension légère)
-- ---------------------------------------------------------------------------
alter table if exists public.profiles
  alter column role set default 'agent';

update public.profiles
set role = 'admin'
where role is null or trim(coalesce(role, '')) = '';

update public.profiles
set role = 'agent'
where role is not null
  and trim(role) not in ('admin', 'manager', 'agent');

alter table if exists public.profiles
  drop constraint if exists profiles_role_check;

alter table if exists public.profiles
  add constraint profiles_role_check check (
    role in ('admin', 'manager', 'agent')
  );

-- ---------------------------------------------------------------------------
-- Accès portail client (lien magique)
-- ---------------------------------------------------------------------------
create table if not exists public.client_portal_access (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  match_snapshot jsonb,
  snapshot_updated_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists client_portal_access_token_hash_idx
  on public.client_portal_access (token_hash);

create index if not exists client_portal_access_contact_id_idx
  on public.client_portal_access (contact_id);

alter table public.client_portal_access enable row level security;

drop policy if exists "client_portal_access_select_agency" on public.client_portal_access;
create policy "client_portal_access_select_agency"
  on public.client_portal_access
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.contacts c
      join public.profiles p on p.agency_id = c.agency_id
      where c.id = client_portal_access.contact_id
        and p.id = auth.uid()
    )
  );

drop policy if exists "client_portal_access_insert_agency" on public.client_portal_access;
create policy "client_portal_access_insert_agency"
  on public.client_portal_access
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.contacts c
      join public.profiles p on p.agency_id = c.agency_id
      where c.id = client_portal_access.contact_id
        and p.id = auth.uid()
    )
  );

drop policy if exists "client_portal_access_update_agency" on public.client_portal_access;
create policy "client_portal_access_update_agency"
  on public.client_portal_access
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.contacts c
      join public.profiles p on p.agency_id = c.agency_id
      where c.id = client_portal_access.contact_id
        and p.id = auth.uid()
    )
  );

drop policy if exists "client_portal_access_delete_agency" on public.client_portal_access;
create policy "client_portal_access_delete_agency"
  on public.client_portal_access
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.contacts c
      join public.profiles p on p.agency_id = c.agency_id
      where c.id = client_portal_access.contact_id
        and p.id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Tags contacts (many-to-many)
-- ---------------------------------------------------------------------------
create table if not exists public.contact_tags (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  slug text not null,
  label text not null,
  color text,
  created_at timestamptz not null default now(),
  constraint contact_tags_agency_slug_unique unique (agency_id, slug)
);

create index if not exists contact_tags_agency_id_idx
  on public.contact_tags (agency_id);

alter table public.contact_tags enable row level security;

drop policy if exists "contact_tags_select_agency" on public.contact_tags;
create policy "contact_tags_select_agency"
  on public.contact_tags
  for select
  to authenticated
  using (
    agency_id = (
      select p.agency_id from public.profiles p where p.id = auth.uid()
    )
  );

drop policy if exists "contact_tags_insert_agency" on public.contact_tags;
create policy "contact_tags_insert_agency"
  on public.contact_tags
  for insert
  to authenticated
  with check (
    agency_id = (
      select p.agency_id from public.profiles p where p.id = auth.uid()
    )
  );

drop policy if exists "contact_tags_update_agency" on public.contact_tags;
create policy "contact_tags_update_agency"
  on public.contact_tags
  for update
  to authenticated
  using (
    agency_id = (
      select p.agency_id from public.profiles p where p.id = auth.uid()
    )
  );

drop policy if exists "contact_tags_delete_agency" on public.contact_tags;
create policy "contact_tags_delete_agency"
  on public.contact_tags
  for delete
  to authenticated
  using (
    agency_id = (
      select p.agency_id from public.profiles p where p.id = auth.uid()
    )
  );

create table if not exists public.contact_tag_links (
  contact_id uuid not null references public.contacts (id) on delete cascade,
  tag_id uuid not null references public.contact_tags (id) on delete cascade,
  primary key (contact_id, tag_id)
);

create index if not exists contact_tag_links_tag_id_idx
  on public.contact_tag_links (tag_id);

alter table public.contact_tag_links enable row level security;

drop policy if exists "contact_tag_links_select_agency" on public.contact_tag_links;
create policy "contact_tag_links_select_agency"
  on public.contact_tag_links
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.contacts c
      join public.profiles p on p.agency_id = c.agency_id
      where c.id = contact_tag_links.contact_id
        and p.id = auth.uid()
    )
  );

drop policy if exists "contact_tag_links_insert_agency" on public.contact_tag_links;
create policy "contact_tag_links_insert_agency"
  on public.contact_tag_links
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.contacts c
      join public.profiles p on p.agency_id = c.agency_id
      where c.id = contact_tag_links.contact_id
        and p.id = auth.uid()
    )
    and exists (
      select 1
      from public.contact_tags t
      join public.profiles p on p.agency_id = t.agency_id
      where t.id = contact_tag_links.tag_id
        and p.id = auth.uid()
    )
  );

drop policy if exists "contact_tag_links_delete_agency" on public.contact_tag_links;
create policy "contact_tag_links_delete_agency"
  on public.contact_tag_links
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.contacts c
      join public.profiles p on p.agency_id = c.agency_id
      where c.id = contact_tag_links.contact_id
        and p.id = auth.uid()
    )
  );
