-- Ajout updated_at sur contacts (compat)
alter table if exists public.contacts
  add column if not exists updated_at timestamptz default now();

-- Backfill si des lignes existent déjà
update public.contacts
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

-- Trigger générique updated_at (utilisé aussi ailleurs si besoin)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at
before update on public.contacts
for each row
execute function public.set_updated_at();

