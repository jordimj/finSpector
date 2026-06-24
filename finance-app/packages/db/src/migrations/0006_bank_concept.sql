alter table expenses
  add column if not exists bank_concept text;

alter table income
  add column if not exists bank_concept text;
