-- Corrige : infinite recursion detected in policy for relation "profiles"
-- La policy précédente lisait `profiles` dans une sous-requête → RLS ré-appliquée en boucle.
--
-- 1) Fonction SECURITY DEFINER : lit le profil connecté sans repasser par la RLS.
-- 2) Deux policies PERMISSIVE (OR) : sa ligne (sans sous-requête) + pairs d’agence si leader.

drop policy if exists "profiles_select_self_or_agency_leaders" on public.profiles;

create or replace function public.profiles_rls_reader_ctx()
returns table (agency uuid, leader boolean)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.agency_id,
    coalesce(lower(trim(p.role::text)), '') in ('admin', 'manager')
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

revoke all on function public.profiles_rls_reader_ctx() from public;
grant execute on function public.profiles_rls_reader_ctx() to authenticated;

drop policy if exists "profiles_select_own_row" on public.profiles;
create policy "profiles_select_own_row"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_select_same_agency_if_leader" on public.profiles;
create policy "profiles_select_same_agency_if_leader"
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles_rls_reader_ctx() ctx
      where ctx.leader = true
        and ctx.agency is not null
        and agency_id = ctx.agency
    )
  );
