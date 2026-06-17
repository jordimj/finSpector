import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { and, eq, isNull } from 'drizzle-orm';
import {
  categories,
  closeDb,
  db,
  expenses,
  imports,
  income,
  subcategories,
} from '@finance/db';
import {
  DEFAULT_EXPENSE_ACCOUNT,
  EXPENSE_ACCOUNTS,
  type ExpenseAccount,
  type ImportSummary,
  type NormalizedTransaction,
} from '@finance/shared';
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
  const options = parseImportArgs(process.argv.slice(2));
  const csvPath = options.csvPath;
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

      const wasInserted = await insertIfNew(
        transaction,
        importRecord.id,
        options.account,
      );
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
  account: ExpenseAccount,
): Promise<boolean> {
  if (transaction.type === 'expense') {
    const categoryId = await getOrCreateCategory(transaction.categoryName);
    const subcategoryId = transaction.subcategoryName
      ? await getOrCreateSubcategory(transaction.subcategoryName, categoryId)
      : undefined;
    const description = transaction.description ?? null;

    const duplicate = await db.query.expenses.findFirst({
      where: and(
        eq(expenses.date, transaction.date),
        eq(expenses.amount, transaction.amount),
        eq(expenses.account, account),
        eq(expenses.categoryId, categoryId),
        subcategoryId === undefined
          ? isNull(expenses.subcategoryId)
          : eq(expenses.subcategoryId, subcategoryId),
        description === null
          ? isNull(expenses.description)
          : eq(expenses.description, description),
      ),
    });

    if (duplicate) {
      return false;
    }

    await db.insert(expenses).values({
      date: transaction.date,
      amount: transaction.amount,
      description,
      account,
      categoryId,
      subcategoryId,
      sourceImportId: importId,
    });

    return true;
  }

  const categoryId = await getOrCreateCategory(transaction.categoryName);
  const subcategoryId = transaction.subcategoryName
    ? await getOrCreateSubcategory(transaction.subcategoryName, categoryId)
    : undefined;
  const description = transaction.description ?? null;

  const duplicate = await db.query.income.findFirst({
    where: and(
      eq(income.date, transaction.date),
      eq(income.amount, transaction.amount),
      eq(income.account, account),
      eq(income.categoryId, categoryId),
      subcategoryId === undefined
        ? isNull(income.subcategoryId)
        : eq(income.subcategoryId, subcategoryId),
      description === null
        ? isNull(income.description)
        : eq(income.description, description),
    ),
  });

  if (duplicate) {
    return false;
  }

  await db.insert(income).values({
    date: transaction.date,
    amount: transaction.amount,
    description,
    account,
    categoryId,
    subcategoryId,
    sourceImportId: importId,
  });

  return true;
}

function parseImportArgs(args: string[]): {
  csvPath: string;
  account: ExpenseAccount;
} {
  let csvPath = defaultSamplePath;
  let account: ExpenseAccount = DEFAULT_EXPENSE_ACCOUNT;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg) {
      continue;
    }

    if (arg === '--account') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --account');
      }

      account = parseExpenseAccount(value);
      index += 1;
      continue;
    }

    if (arg.startsWith('--account=')) {
      account = parseExpenseAccount(arg.slice('--account='.length));
      continue;
    }

    if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    }

    csvPath = arg;
  }

  return { csvPath, account };
}

function parseExpenseAccount(value: string): ExpenseAccount {
  if (EXPENSE_ACCOUNTS.includes(value as ExpenseAccount)) {
    return value as ExpenseAccount;
  }

  throw new Error(
    `Invalid account "${value}". Expected one of: ${EXPENSE_ACCOUNTS.join(', ')}`,
  );
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
