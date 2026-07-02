import path from "node:path";
import { existsSync } from "node:fs";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const { Pool } = pg;

loadEnv();

const connectionString =
  process.env.DATABASE_URL ?? "postgres://finance:finance@localhost:5432/finance_app";

export const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });

export async function closeDb(): Promise<void> {
  await pool.end();
}

function loadEnv(): void {
  const candidates = [
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "..", ".env"),
    path.join(process.cwd(), "..", "..", ".env")
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      dotenv.config({ path: candidate });
      return;
    }
  }
}
