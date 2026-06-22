# Personal Finance Analytics App

First iteration of a local-first finance analytics foundation. It imports normalized transaction data into PostgreSQL and runs basic analytics from Node scripts.

This intentionally does not include a frontend, API, auth, cloud sync, reminders, or AI assistant yet.

## Stack

- pnpm workspace
- TypeScript
- PostgreSQL via Docker Compose
- Drizzle ORM schema definitions
- SQL migrations applied by a small Node migration runner
- Node scripts for import and analytics

## Structure

```text
packages/
  db/         PostgreSQL client, Drizzle schema, migrations
  importer/  Sample CSV importer and normalization pipeline
  analytics/ Local reporting scripts
  shared/    Shared constants and types
```

## Setup

```bash
cp .env.example .env
pnpm install
pnpm db:up
pnpm db:migrate
```

The default database URL is:

```text
postgres://finance:finance@localhost:5432/finance_app
```

## Import Sample Data

```bash
pnpm import:sample
pnpm import:sample -- packages/importer/src/data/transactions.csv --account shared
```

The sample importer reads:

```text
packages/importer/src/sample-data/sample-transactions.csv
```

It currently demonstrates the future Excel import pipeline with a simple CSV source:

- normalize dates to `YYYY-MM-DD`
- normalize amounts to positive decimal strings
- infer or read transaction type
- map category and subcategory names
- detect duplicates by same date, amount, account, category, subcategory, and description
- tag expense rows with an account (`mine`, `shared`, `kids`, or `splitwise`; defaults to `mine`)
- insert into PostgreSQL
- print an import summary

When you replace CSV with real Excel files, customize `packages/importer/src/parse-excel.ts` to map bank-specific columns into `RawTransactionRow`. The rest of the pipeline can stay mostly the same.

## Hidden Import Assistant

The app includes a low-visibility utility route at:

```text
/tools/import-assistant
```

Upload a bank PDF or Excel spreadsheet there to preview extracted rows, fuzzy category suggestions from historical transactions, and a downloadable review CSV. It does not import, persist, or save the uploaded source file.

## Analytics

```bash
pnpm analyze:monthly
pnpm analyze:yearly
pnpm analyze:categories
pnpm analyze:descriptions
```

## Database Tables

- `expenses`
- `income`
- `categories`
- `subcategories`
- `imports`
- `schema_migrations`

Expenses support:

- `id`
- `date`
- `amount`
- `description`
- `account`
- `category_id`
- `subcategory_id`
- `source_import_id`
- `created_at`
- `updated_at`

Income supports the same shape:

- `id`
- `date`
- `amount`
- `description`
- `account`
- `category_id`
- `subcategory_id`
- `source_import_id`
- `created_at`
- `updated_at`

## Next Good Steps

1. Add a real Excel parser for one bank export format.
2. Add import preview and row-level validation reports.
3. Improve duplicate detection with description similarity.
4. Add account/source tables if multiple bank accounts are imported.
5. Add tests around normalization and category mapping.
