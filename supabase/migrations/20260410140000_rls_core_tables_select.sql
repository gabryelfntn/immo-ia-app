-- Lecture dashboard : properties, contacts, generated_listings, agencies
-- Aligné sur followup_emails (agency_id = profil connecté).
-- À exécuter si le tableau de bord est vide / erreur « permission » alors que les données existent en base.
-- N'active pas RLS ici : si une table n'avait pas RLS, ces politiques seront prêtes quand tu activeras RLS.

drop policy if exists "core_properties_select_via_profile_agency" on public.properties;
create policy "core_properties_select_via_profile_agency"
  on public.properties
  for select
  to authenticated
  using (
    agency_id is not null
    and agency_id = (
      select p.agency_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "core_contacts_select_via_profile_agency" on public.contacts;
create policy "core_contacts_select_via_profile_agency"
  on public.contacts
  for select
  to authenticated
  using (
    agency_id is not null
    and agency_id = (
      select p.agency_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "core_generated_listings_select_via_profile_agency"
  on public.generated_listings;
create policy "core_generated_listings_select_via_profile_agency"
  on public.generated_listings
  for select
  to authenticated
  using (
    agency_id is not null
    and agency_id = (
      select p.agency_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "core_agencies_select_via_profile" on public.agencies;
create policy "core_agencies_select_via_profile"
  on public.agencies
  for select
  to authenticated
  using (
    id = (
      select p.agency_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );
