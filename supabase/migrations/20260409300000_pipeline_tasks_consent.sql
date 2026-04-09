-- Pipeline commercial, consentement prospection, tâches agence

alter table public.contacts
  add column if not exists pipeline_stage text;

update public.contacts
set pipeline_stage = 'premier_contact'
where pipeline_stage is null;

alter table public.contacts
  alter column pipeline_stage set default 'premier_contact';

alter table public.contacts
  alter column pipeline_stage set not null;

alter table public.contacts
  drop constraint if exists contacts_pipeline_stage_check;

alter table public.contacts
  add constraint contacts_pipeline_stage_check check (
    pipeline_stage in (
      'premier_contact',
      'qualifie',
      'visite',
      'offre',
      'signature',
      'fidelisation'
    )
  );

create index if not exists contacts_pipeline_stage_idx
  on public.contacts (agency_id, pipeline_stage);

alter table public.contacts
  add column if not exists prospecting_consent boolean not null default true;

create table if not exists public.agency_tasks (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  agent_id uuid not null references public.profiles (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  property_id uuid references public.properties (id) on delete set null,
  title text not null,
  due_at timestamptz not null,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists agency_tasks_agency_open_due_idx
  on public.agency_tasks (agency_id, due_at asc)
  where completed_at is null;

alter table public.agency_tasks enable row level security;

drop policy if exists "agency_tasks_select_agency" on public.agency_tasks;
create policy "agency_tasks_select_agency"
  on public.agency_tasks
  for select
  to authenticated
  using (
    agency_id = (
      select p.agency_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "agency_tasks_insert_agency" on public.agency_tasks;
create policy "agency_tasks_insert_agency"
  on public.agency_tasks
  for insert
  to authenticated
  with check (
    agency_id = (
      select p.agency_id
      from public.profiles p
      where p.id = auth.uid()
    )
    and agent_id = auth.uid()
  );

drop policy if exists "agency_tasks_update_agency" on public.agency_tasks;
create policy "agency_tasks_update_agency"
  on public.agency_tasks
  for update
  to authenticated
  using (
    agency_id = (
      select p.agency_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "agency_tasks_delete_agency" on public.agency_tasks;
create policy "agency_tasks_delete_agency"
  on public.agency_tasks
  for delete
  to authenticated
  using (
    agency_id = (
      select p.agency_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );
