do $$
begin
  create type payment_cadence as enum (
    'oneTime',
    'monthly',
    'quarterly',
    'annually'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type payment_reminder_source as enum ('manual', 'detected');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type payment_occurrence_status as enum ('paid', 'skipped');
exception
  when duplicate_object then null;
end $$;

create table payment_reminders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(12, 2) not null,
  amount_tolerance numeric(12, 2) not null default 5.00,
  cadence payment_cadence not null default 'monthly',
  source payment_reminder_source not null default 'manual',
  account expense_account not null default 'mine',
  category_id integer not null references categories(id),
  subcategory_id integer,
  match_text text,
  start_date date not null,
  due_day integer not null,
  lead_days integer not null default 7,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_reminders_due_day_check check (due_day between 1 and 31),
  constraint payment_reminders_lead_days_check check (lead_days between 0 and 30),
  constraint payment_reminders_amount_check check (amount > 0),
  constraint payment_reminders_amount_tolerance_check check (amount_tolerance >= 0),
  constraint payment_reminders_subcategory_category_fk
    foreign key (subcategory_id, category_id)
    references subcategories(id, category_id)
);

create index payment_reminders_account_idx on payment_reminders(account);
create index payment_reminders_active_idx on payment_reminders(active);
create index payment_reminders_category_id_idx on payment_reminders(category_id);

create table payment_reminder_occurrences (
  id uuid primary key default gen_random_uuid(),
  payment_reminder_id uuid not null references payment_reminders(id) on delete cascade,
  due_date date not null,
  status payment_occurrence_status not null,
  matched_expense_id uuid references expenses(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  skipped_at timestamptz,
  constraint payment_reminder_occurrences_status_timestamp_check check (
    (status = 'paid' and paid_at is not null)
    or (status = 'skipped' and skipped_at is not null)
  )
);

create unique index payment_reminder_occurrences_reminder_due_unique
  on payment_reminder_occurrences(payment_reminder_id, due_date);
create index payment_reminder_occurrences_reminder_id_idx
  on payment_reminder_occurrences(payment_reminder_id);
create index payment_reminder_occurrences_due_date_idx
  on payment_reminder_occurrences(due_date);
create index payment_reminder_occurrences_matched_expense_id_idx
  on payment_reminder_occurrences(matched_expense_id);

create table payment_reminder_dismissed_suggestions (
  suggestion_key text primary key,
  dismissed_at timestamptz not null default now()
);
