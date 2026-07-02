do $$
begin
  create type expense_account as enum ('mine', 'shared', 'kids', 'splitwise');
exception
  when duplicate_object then null;
end $$;

alter table expenses
  add column if not exists account expense_account not null default 'mine';

drop index if exists expenses_duplicate_lookup_idx;
drop index if exists expenses_category_id_idx;
drop index if exists expenses_subcategory_id_idx;
drop index if exists expenses_merchant_name_idx;

alter table expenses rename to expenses_old;

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

insert into expenses (
  id,
  date,
  amount,
  merchant_name,
  original_description,
  category_id,
  subcategory_id,
  notes,
  account,
  source_import_id,
  created_at,
  updated_at
)
select
  id,
  date,
  amount,
  merchant_name,
  original_description,
  category_id,
  subcategory_id,
  notes,
  account,
  source_import_id,
  created_at,
  updated_at
from expenses_old;

drop table expenses_old;

create index expenses_duplicate_lookup_idx on expenses (date, amount, account);
create index expenses_category_id_idx on expenses (category_id);
create index expenses_subcategory_id_idx on expenses (subcategory_id);
create index expenses_merchant_name_idx on expenses (merchant_name);
