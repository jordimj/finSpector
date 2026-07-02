drop index if exists expenses_merchant_name_idx;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'expenses'
      and column_name = 'original_description'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_name = 'expenses'
      and column_name = 'description'
  ) then
    alter table expenses rename column original_description to description;
  end if;
end $$;

alter table expenses
  add column if not exists description text;

alter table expenses
  alter column description drop not null,
  drop column if exists merchant_name,
  drop column if exists notes;
