-- Lit profiles.agency_id pour auth.uid() en contournant la RLS (SECURITY DEFINER).
-- Évite les SELECT vides sur properties/contacts alors que profiles.agency_id est bon :
-- les sous-requêtes « select agency_id from profiles where id = auth.uid() » dans
-- les policies peuvent se comporter de façon fragile selon les politiques empilées.

create or replace function public.auth_user_agency_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.agency_id
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

revoke all on function public.auth_user_agency_id() from public;
grant execute on function public.auth_user_agency_id() to authenticated;

-- Core dashboard (migration 10140000)
drop policy if exists "core_properties_select_via_profile_agency" on public.properties;
create policy "core_properties_select_via_profile_agency"
  on public.properties
  for select
  to authenticated
  using (
    agency_id is not null
    and agency_id = public.auth_user_agency_id()
  );

drop policy if exists "core_contacts_select_via_profile_agency" on public.contacts;
create policy "core_contacts_select_via_profile_agency"
  on public.contacts
  for select
  to authenticated
  using (
    agency_id is not null
    and agency_id = public.auth_user_agency_id()
  );

drop policy if exists "core_generated_listings_select_via_profile_agency"
  on public.generated_listings;
create policy "core_generated_listings_select_via_profile_agency"
  on public.generated_listings
  for select
  to authenticated
  using (
    agency_id is not null
    and agency_id = public.auth_user_agency_id()
  );

drop policy if exists "core_agencies_select_via_profile" on public.agencies;
create policy "core_agencies_select_via_profile"
  on public.agencies
  for select
  to authenticated
  using (id = public.auth_user_agency_id());

-- Relances (migration 092800)
drop policy if exists "followup_emails_select_agency" on public.followup_emails;
create policy "followup_emails_select_agency"
  on public.followup_emails
  for select
  to authenticated
  using (agency_id = public.auth_user_agency_id());

-- Tâches (migration 093000)
drop policy if exists "agency_tasks_select_agency" on public.agency_tasks;
create policy "agency_tasks_select_agency"
  on public.agency_tasks
  for select
  to authenticated
  using (agency_id = public.auth_user_agency_id());

drop policy if exists "agency_tasks_insert_agency" on public.agency_tasks;
create policy "agency_tasks_insert_agency"
  on public.agency_tasks
  for insert
  to authenticated
  with check (
    agency_id = public.auth_user_agency_id()
    and agent_id = auth.uid()
  );

drop policy if exists "agency_tasks_update_agency" on public.agency_tasks;
create policy "agency_tasks_update_agency"
  on public.agency_tasks
  for update
  to authenticated
  using (agency_id = public.auth_user_agency_id());

drop policy if exists "agency_tasks_delete_agency" on public.agency_tasks;
create policy "agency_tasks_delete_agency"
  on public.agency_tasks
  for delete
  to authenticated
  using (agency_id = public.auth_user_agency_id());
