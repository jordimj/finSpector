drop index if exists expenses_duplicate_lookup_idx;

create index expenses_duplicate_lookup_idx on expenses (
  date,
  amount,
  account,
  category_id,
  subcategory_id,
  description
);
