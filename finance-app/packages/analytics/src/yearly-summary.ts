import { closeDb, pool } from "@finance/db";

type YearlySummaryRow = {
  year: string;
  income: string;
  expenses: string;
  net: string;
  transaction_count: string;
};

async function main(): Promise<void> {
  const result = await pool.query<YearlySummaryRow>(`
    with transactions as (
      select date, amount, 'expense' as type from expenses
      union all
      select date, amount, 'income' as type from income
    )
    select
      extract(year from date)::text as year,
      coalesce(sum(amount) filter (where type = 'income'), 0)::numeric(12, 2) as income,
      coalesce(sum(amount) filter (where type = 'expense'), 0)::numeric(12, 2) as expenses,
      (
        coalesce(sum(amount) filter (where type = 'income'), 0) -
        coalesce(sum(amount) filter (where type = 'expense'), 0)
      )::numeric(12, 2) as net,
      count(*)::text as transaction_count
    from transactions
    group by year
    order by year;
  `);

  console.table(result.rows);
  await closeDb();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await closeDb();
  process.exit(1);
});
