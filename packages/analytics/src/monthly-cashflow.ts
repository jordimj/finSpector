import { closeDb, pool } from "@finance/db";
import { personalAmountSql } from "./personal-amount-sql.js";

type MonthlyCashflowRow = {
  month: string;
  income: string;
  expenses: string;
  net: string;
};

async function main(): Promise<void> {
  const result = await pool.query<MonthlyCashflowRow>(`
    with months as (
      select
        date_trunc('month', date)::date as month,
        ${personalAmountSql("expenses")} as amount,
        'expense' as type
      from expenses
      union all
      select
        date_trunc('month', date)::date as month,
        ${personalAmountSql("income")} as amount,
        'income' as type
      from income
    )
    select
      to_char(month, 'YYYY-MM') as month,
      coalesce(sum(amount) filter (where type = 'income'), 0)::numeric(12, 2) as income,
      coalesce(sum(amount) filter (where type = 'expense'), 0)::numeric(12, 2) as expenses,
      (
        coalesce(sum(amount) filter (where type = 'income'), 0) -
        coalesce(sum(amount) filter (where type = 'expense'), 0)
      )::numeric(12, 2) as net
    from months
    group by month
    order by month;
  `);

  console.table(result.rows);
  await closeDb();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await closeDb();
  process.exit(1);
});
