-- Automatisation des relances email : opt-out + logs d'envoi

-- Champs sur contacts
alter table if exists public.contacts
  add column if not exists followup_opt_out boolean not null default false;

alter table if exists public.contacts
  add column if not exists last_followup_sent_at timestamptz;

create index if not exists contacts_followup_opt_out_idx
  on public.contacts (followup_opt_out);

create index if not exists contacts_last_followup_sent_at_idx
  on public.contacts (last_followup_sent_at desc);

-- Journal d'envoi (anti-doublon + audit)
create table if not exists public.followup_emails (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  agent_id uuid not null references public.profiles (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  subject text not null,
  body text not null,
  tone text,
  provider text not null default 'resend',
  provider_message_id text,
  status text not null default 'sent',
  error text,
  created_at timestamptz default now(),
  constraint followup_emails_status_check check (status in ('sent','failed'))
);

create index if not exists followup_emails_agency_id_idx
  on public.followup_emails (agency_id);

create index if not exists followup_emails_contact_id_idx
  on public.followup_emails (contact_id);

create index if not exists followup_emails_created_at_idx
  on public.followup_emails (created_at desc);

