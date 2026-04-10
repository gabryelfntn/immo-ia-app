-- Page Équipe : les admin/manager doivent pouvoir lire les profils de la même agence.
-- Sans cette politique, la RLS standard (souvent « uniquement sa ligne ») ne retourne que soi-même.

drop policy if exists "profiles_select_self_or_agency_leaders" on public.profiles;

create policy "profiles_select_self_or_agency_leaders"
  on public.profiles
  for select
  to authenticated
  using (
    id = auth.uid()
    or (
      agency_id is not null
      and agency_id in (
        select p.agency_id
        from public.profiles p
        where p.id = auth.uid()
          and lower(trim(p.role::text)) in ('admin', 'manager')
          and p.agency_id is not null
      )
    )
  );
