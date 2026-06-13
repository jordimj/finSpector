import { closeDb, pool } from "@finance/db";

type TopMerchantRow = {
  merchant_name: string;
  transaction_count: string;
  total: string;
};

async function main(): Promise<void> {
  const limit = Number(process.argv[2] ?? 10);
  const result = await pool.query<TopMerchantRow>(
    `
      select
        merchant_name,
        count(*)::text as transaction_count,
        sum(amount)::numeric(12, 2) as total
      from expenses
      group by merchant_name
      order by total desc
      limit $1;
    `,
    [limit]
  );

  console.table(result.rows);
  await closeDb();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await closeDb();
  process.exit(1);
});
