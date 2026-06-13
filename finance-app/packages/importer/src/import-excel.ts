import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { and, eq } from 'drizzle-orm';
import {
  categories,
  closeDb,
  db,
  expenses,
  imports,
  income,
  subcategories,
} from '@finance/db';
import type { ImportSummary, NormalizedTransaction } from '@finance/shared';
import { normalizeTransaction } from './normalize-expense.js';
import { parseSampleCsv } from './parse-excel.js';
import { validateTransaction } from './validate-expense.js';

const currentFile = fileURLToPath(import.meta.url);
const packageDir = path.resolve(path.dirname(currentFile), '..');
const defaultSamplePath = path.join(
  packageDir,
  'src',
  'data',
  'transactions.csv',
);

async function main(): Promise<void> {
  const csvPath = process.argv[2] ?? defaultSamplePath;
  const rawRows = await parseSampleCsv(csvPath);

  const importRows = await db
    .insert(imports)
    .values({
      sourceName: path.basename(csvPath),
      sourceType: 'sample_csv',
      rowCount: rawRows.length.toString(),
    })
    .returning({ id: imports.id, sourceName: imports.sourceName });

  const importRecord = requiredSingle(importRows, 'import record');
  const summary: ImportSummary = {
    importId: importRecord.id,
    sourceName: importRecord.sourceName,
    totalRows: rawRows.length,
    insertedExpenses: 0,
    insertedIncome: 0,
    duplicateRows: 0,
    skippedRows: 0,
  };

  for (const rawRow of rawRows) {
    try {
      const transaction = normalizeTransaction(rawRow);
      const errors = validateTransaction(transaction);

      if (errors.length > 0) {
        summary.skippedRows += 1;
        console.warn(
          `Skipped row "${rawRow.description}": ${errors.join('; ')}`,
        );
        continue;
      }

      const wasInserted = await insertIfNew(transaction, importRecord.id);
      if (!wasInserted) {
        summary.duplicateRows += 1;
        continue;
      }

      if (transaction.type === 'expense') {
        summary.insertedExpenses += 1;
      } else {
        summary.insertedIncome += 1;
      }
    } catch (error) {
      summary.skippedRows += 1;
      console.warn(
        `Skipped row "${rawRow.description}": ${(error as Error).message}`,
      );
    }
  }

  await db
    .update(imports)
    .set({
      status: 'completed',
      duplicateCount: summary.duplicateRows.toString(),
      completedAt: new Date(),
    })
    .where(eq(imports.id, importRecord.id));

  printImportSummary(summary);
  await closeDb();
}

async function insertIfNew(
  transaction: NormalizedTransaction,
  importId: string,
): Promise<boolean> {
  if (transaction.type === 'expense') {
    const duplicate = await db.query.expenses.findFirst({
      where: and(
        eq(expenses.date, transaction.date),
        eq(expenses.amount, transaction.amount),
      ),
    });

    if (duplicate) {
      return false;
    }

    const categoryId = await getOrCreateCategory(transaction.categoryName);
    const subcategoryId = transaction.subcategoryName
      ? await getOrCreateSubcategory(transaction.subcategoryName, categoryId)
      : undefined;

    await db.insert(expenses).values({
      date: transaction.date,
      amount: transaction.amount,
      merchantName: transaction.merchantName,
      originalDescription: transaction.originalDescription,
      categoryId,
      subcategoryId,
      notes: transaction.notes,
      sourceImportId: importId,
    });

    return true;
  }

  const duplicate = await db.query.income.findFirst({
    where: and(
      eq(income.date, transaction.date),
      eq(income.amount, transaction.amount),
    ),
  });

  if (duplicate) {
    return false;
  }

  const categoryId = await getOrCreateCategory(transaction.categoryName);

  await db.insert(income).values({
    date: transaction.date,
    amount: transaction.amount,
    payerName: transaction.merchantName,
    originalDescription: transaction.originalDescription,
    categoryId,
    notes: transaction.notes,
    sourceImportId: importId,
  });

  return true;
}

async function getOrCreateCategory(name: string): Promise<number> {
  const existing = await db.query.categories.findFirst({
    where: eq(categories.name, name),
  });

  if (existing) {
    return existing.id;
  }

  const insertedRows = await db
    .insert(categories)
    .values({ name })
    .returning({ id: categories.id });

  return requiredSingle(insertedRows, `category ${name}`).id;
}

async function getOrCreateSubcategory(
  name: string,
  categoryId: number,
): Promise<number> {
  const existing = await db.query.subcategories.findFirst({
    where: and(
      eq(subcategories.name, name),
      eq(subcategories.categoryId, categoryId),
    ),
  });

  if (existing) {
    return existing.id;
  }

  const insertedRows = await db
    .insert(subcategories)
    .values({ name, categoryId })
    .returning({ id: subcategories.id });

  return requiredSingle(insertedRows, `subcategory ${name}`).id;
}

function printImportSummary(summary: ImportSummary): void {
  console.log('\nImport summary');
  console.log(`Source: ${summary.sourceName}`);
  console.log(`Import ID: ${summary.importId}`);
  console.log(`Total rows: ${summary.totalRows}`);
  console.log(`Inserted expenses: ${summary.insertedExpenses}`);
  console.log(`Inserted income: ${summary.insertedIncome}`);
  console.log(`Duplicates: ${summary.duplicateRows}`);
  console.log(`Skipped: ${summary.skippedRows}`);
}

function requiredSingle<T>(rows: T[], label: string): T {
  const row = rows[0];
  if (!row) {
    throw new Error(`Expected ${label} to be returned from database`);
  }

  return row;
}

main().catch(async (error: unknown) => {
  console.error(error);
  await closeDb();
  process.exit(1);
});
