drop index if exists income_duplicate_lookup_idx;
drop index if exists income_payer_name_idx;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'income'
      and column_name = 'original_description'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'income'
      and column_name = 'description'
  ) then
    alter table income rename column original_description to description;
  end if;
end $$;

alter table income
  add column if not exists description text,
  add column if not exists subcategory_id integer,
  add column if not exists account expense_account not null default 'mine';

alter table income
  alter column description drop not null,
  drop column if exists payer_name,
  drop column if exists notes;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'income_subcategory_category_fk'
  ) then
    alter table income
      add constraint income_subcategory_category_fk
      foreign key (subcategory_id, category_id)
      references subcategories(id, category_id);
  end if;
end $$;

create index income_duplicate_lookup_idx on income (
  date,
  amount,
  account,
  category_id,
  subcategory_id,
  description
);

create index if not exists income_subcategory_id_idx on income (subcategory_id);
