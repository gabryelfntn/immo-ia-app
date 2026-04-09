-- Colonnes relances sur contacts (si la migration 270000 n'a pas été appliquée en entier)
alter table if exists public.contacts
  add column if not exists followup_opt_out boolean not null default false;

alter table if exists public.contacts
  add column if not exists last_followup_sent_at timestamptz;

create index if not exists contacts_followup_opt_out_idx
  on public.contacts (followup_opt_out);

create index if not exists contacts_last_followup_sent_at_idx
  on public.contacts (last_followup_sent_at desc);

-- Sécuriser followup_emails : plus "unrestricted"
alter table if exists public.followup_emails enable row level security;

-- Lecture uniquement pour les membres de la même agence (dashboard)
drop policy if exists "followup_emails_select_agency" on public.followup_emails;
create policy "followup_emails_select_agency"
  on public.followup_emails
  for select
  to authenticated
  using (
    agency_id = (
      select p.agency_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );

-- Aucune policy INSERT/UPDATE/DELETE pour authenticated : l'écriture se fait via
-- la Edge Function (service role), qui bypass le RLS.
