-- Pièces jointes contacts, rappels « à contacter / envoyer », notifications push

-- ---------------------------------------------------------------------------
-- Fichiers contacts (métadonnées ; fichiers dans bucket storage contact-files)
-- ---------------------------------------------------------------------------
create table if not exists public.contact_attachments (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes integer,
  label text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create index if not exists contact_attachments_contact_idx
  on public.contact_attachments (contact_id, created_at desc);

alter table public.contact_attachments enable row level security;

drop policy if exists "contact_attachments_select_agency" on public.contact_attachments;
create policy "contact_attachments_select_agency"
  on public.contact_attachments
  for select
  to authenticated
  using (
    agency_id = (
      select p.agency_id from public.profiles p where p.id = auth.uid()
    )
  );

drop policy if exists "contact_attachments_insert_agency" on public.contact_attachments;
create policy "contact_attachments_insert_agency"
  on public.contact_attachments
  for insert
  to authenticated
  with check (
    agency_id = (
      select p.agency_id from public.profiles p where p.id = auth.uid()
    )
    and created_by = auth.uid()
  );

drop policy if exists "contact_attachments_delete_agency" on public.contact_attachments;
create policy "contact_attachments_delete_agency"
  on public.contact_attachments
  for delete
  to authenticated
  using (
    agency_id = (
      select p.agency_id from public.profiles p where p.id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Rappels manuels (email / relance à ne pas oublier — pas d’envoi auto)
-- ---------------------------------------------------------------------------
create table if not exists public.contact_send_reminders (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  agent_id uuid not null references public.profiles (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  remind_at timestamptz not null,
  note text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists contact_send_reminders_agent_due_idx
  on public.contact_send_reminders (agent_id, remind_at asc)
  where completed_at is null;

alter table public.contact_send_reminders enable row level security;

drop policy if exists "contact_send_reminders_select_agency" on public.contact_send_reminders;
create policy "contact_send_reminders_select_agency"
  on public.contact_send_reminders
  for select
  to authenticated
  using (
    agency_id = (
      select p.agency_id from public.profiles p where p.id = auth.uid()
    )
  );

drop policy if exists "contact_send_reminders_insert_agency" on public.contact_send_reminders;
create policy "contact_send_reminders_insert_agency"
  on public.contact_send_reminders
  for insert
  to authenticated
  with check (
    agency_id = (
      select p.agency_id from public.profiles p where p.id = auth.uid()
    )
    and agent_id = auth.uid()
  );

drop policy if exists "contact_send_reminders_update_agency" on public.contact_send_reminders;
create policy "contact_send_reminders_update_agency"
  on public.contact_send_reminders
  for update
  to authenticated
  using (
    agency_id = (
      select p.agency_id from public.profiles p where p.id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Abonnements Web Push (une ligne par utilisateur, dernier appareil gagne)
-- ---------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  subscription jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
  on public.push_subscriptions
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own"
  on public.push_subscriptions
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own"
  on public.push_subscriptions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own"
  on public.push_subscriptions
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Bucket Storage (privé) + politiques sur storage.objects
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('contact-files', 'contact-files', false)
on conflict (id) do nothing;

drop policy if exists "contact_files_select" on storage.objects;
create policy "contact_files_select"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'contact-files'
    and (storage.foldername(name))[1] = (
      select p.agency_id::text from public.profiles p where p.id = auth.uid()
    )
  );

drop policy if exists "contact_files_insert" on storage.objects;
create policy "contact_files_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'contact-files'
    and (storage.foldername(name))[1] = (
      select p.agency_id::text from public.profiles p where p.id = auth.uid()
    )
  );

drop policy if exists "contact_files_delete" on storage.objects;
create policy "contact_files_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'contact-files'
    and (storage.foldername(name))[1] = (
      select p.agency_id::text from public.profiles p where p.id = auth.uid()
    )
  );
