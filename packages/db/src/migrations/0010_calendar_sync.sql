create table calendar_integrations (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_account_id text,
  account_email text,
  calendar_id text,
  calendar_name text not null default 'FinHunter Reminders',
  token_ref text,
  scopes text[] not null default array[]::text[],
  status text not null default 'disconnected',
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_integrations_provider_check check (provider in ('google')),
  constraint calendar_integrations_status_check check (
    status in ('connected', 'disconnected', 'error')
  )
);

create unique index calendar_integrations_provider_unique
  on calendar_integrations(provider);
create index calendar_integrations_status_idx
  on calendar_integrations(status);

create table calendar_event_syncs (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references calendar_integrations(id) on delete cascade,
  payment_reminder_id uuid not null references payment_reminders(id) on delete cascade,
  due_date date not null,
  google_event_id text not null,
  occurrence_key text not null,
  payload_hash text not null,
  last_synced_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index calendar_event_syncs_occurrence_unique
  on calendar_event_syncs(integration_id, payment_reminder_id, due_date);
create unique index calendar_event_syncs_google_event_unique
  on calendar_event_syncs(integration_id, google_event_id);
create index calendar_event_syncs_integration_idx
  on calendar_event_syncs(integration_id);
create index calendar_event_syncs_deleted_idx
  on calendar_event_syncs(deleted_at);

create table calendar_oauth_states (
  state text primary key,
  code_verifier text not null,
  redirect_path text not null default '/upcoming',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);

create index calendar_oauth_states_expires_idx
  on calendar_oauth_states(expires_at);
