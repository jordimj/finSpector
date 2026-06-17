import { closeDb, pool } from "@finance/db";

type TopDescriptionRow = {
  description: string;
  transaction_count: string;
  total: string;
};

async function main(): Promise<void> {
  const limit = Number(process.argv[2] ?? 10);
  const result = await pool.query<TopDescriptionRow>(
    `
      select
        coalesce(description, '[no description]') as description,
        count(*)::text as transaction_count,
        sum(amount)::numeric(12, 2) as total
      from expenses
      group by coalesce(description, '[no description]')
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
