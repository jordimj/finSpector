import { closeDb, pool } from "@finance/db";
import { personalAmountSql } from "./personal-amount-sql.js";

type CategoryBreakdownRow = {
  category: string;
  transaction_count: string;
  total: string;
};

async function main(): Promise<void> {
  const result = await pool.query<CategoryBreakdownRow>(`
    select
      categories.name as category,
      count(expenses.id)::text as transaction_count,
      coalesce(sum(${personalAmountSql("expenses")}), 0)::numeric(12, 2) as total
    from expenses
    join categories on categories.id = expenses.category_id
    group by categories.name
    order by coalesce(sum(${personalAmountSql("expenses")}), 0) desc;
  `);

  console.table(result.rows);
  await closeDb();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await closeDb();
  process.exit(1);
});
