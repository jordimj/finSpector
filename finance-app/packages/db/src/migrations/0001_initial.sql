create extension if not exists "pgcrypto";

do $$
begin
  create type import_status as enum ('started', 'completed', 'failed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type expense_account as enum ('mine', 'shared', 'kids', 'splitwise');
exception
  when duplicate_object then null;
end $$;

create table categories (
  id integer primary key generated always as identity,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index categories_name_unique on categories (name);

create table subcategories (
  id integer primary key generated always as identity,
  category_id integer not null references categories(id),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subcategories_category_name_unique on subcategories (category_id, name);
create unique index subcategories_id_category_unique on subcategories (id, category_id);
create index subcategories_category_id_idx on subcategories (category_id);

create table imports (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_type text not null,
  status import_status not null default 'started',
  row_count numeric not null default 0,
  duplicate_count numeric not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  amount numeric(12, 2) not null,
  merchant_name text not null,
  original_description text not null,
  category_id integer not null references categories(id),
  subcategory_id integer,
  notes text,
  account expense_account not null default 'mine',
  source_import_id uuid references imports(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expenses_subcategory_category_fk
    foreign key (subcategory_id, category_id)
    references subcategories(id, category_id)
);

create index expenses_duplicate_lookup_idx on expenses (date, amount, account);
create index expenses_category_id_idx on expenses (category_id);
create index expenses_subcategory_id_idx on expenses (subcategory_id);
create index expenses_merchant_name_idx on expenses (merchant_name);

create table income (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  amount numeric(12, 2) not null,
  payer_name text not null,
  original_description text not null,
  category_id integer not null references categories(id),
  notes text,
  source_import_id uuid references imports(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index income_duplicate_lookup_idx on income (date, amount);
create index income_category_id_idx on income (category_id);
create index income_payer_name_idx on income (payer_name);
