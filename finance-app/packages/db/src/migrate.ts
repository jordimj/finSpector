import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./client.js";

const currentFile = fileURLToPath(import.meta.url);
const migrationsDir = path.join(path.dirname(currentFile), "migrations");

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    );
  `);
}

async function getAppliedMigrationIds(): Promise<Set<string>> {
  const result = await pool.query<{ id: string }>("select id from schema_migrations");
  return new Set(result.rows.map((row) => row.id));
}

async function applyMigration(fileName: string): Promise<void> {
  const sql = await readFile(path.join(migrationsDir, fileName), "utf8");

  await pool.query("begin");
  try {
    await pool.query(sql);
    await pool.query("insert into schema_migrations (id) values ($1)", [fileName]);
    await pool.query("commit");
    console.log(`Applied ${fileName}`);
  } catch (error) {
    await pool.query("rollback");
    throw error;
  }
}

async function main(): Promise<void> {
  await ensureMigrationsTable();

  const applied = await getAppliedMigrationIds();
  const migrationFiles = (await readdir(migrationsDir))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  for (const fileName of migrationFiles) {
    if (!applied.has(fileName)) {
      await applyMigration(fileName);
    }
  }

  console.log("Database migrations are up to date.");
  await pool.end();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
