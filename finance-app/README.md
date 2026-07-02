# FinHunter

FinHunter is a local-first personal finance app for importing transaction exports, reviewing spending, and tracking upcoming payments. It runs a React/Vite web app against a Fastify API and stores normalized data in local PostgreSQL.

The app is built for personal use, so the default setup assumes a local database and private transaction files rather than hosted auth or cloud sync.

## What It Does

- Dashboard with recent activity, last-month spending, account summaries, and upcoming payments
- Cockpit views for focused subjects such as home, flat, parking, salaries, and car expenses
- Analytics for cashflow, income vs. expenses, category spend, and projections
- Transaction search and filtering by type, account, category, subcategory, and date range
- Payment reminders with manual reminders, detected candidates, due/overdue states, paid/skipped overrides, and account filters
- Import assistant for previewing PDF or spreadsheet bank files, suggesting categories from history, reviewing rows, and exporting review CSVs
- Script-based imports and analytics for the local database

## Stack

- pnpm workspace managed through Corepack
- TypeScript and ESM
- React, Vite, React Router, TanStack Query, Tailwind CSS, Recharts, and PWA support
- Fastify API with CORS, Helmet, and JSON error handling
- PostgreSQL via Docker Compose
- Drizzle ORM schema definitions plus SQL migrations
- Node/tsx scripts for imports and analytics

## Workspace

```text
apps/
  api/        Fastify API, static web serving, route tests
  web/        React/Vite frontend and PWA assets

packages/
  analytics/  Local reporting scripts
  db/         PostgreSQL client, Drizzle schema, migrations
  importer/   CSV-like import pipeline for normalized transactions
  shared/     Shared constants and TypeScript types
```

The repository wrapper is one level up. Run project commands from `finance-app/`.

## Setup

```bash
corepack pnpm install
cp .env.example .env
corepack pnpm db:up
corepack pnpm db:migrate
```

Default database URL:

```text
postgres://finance:finance@localhost:5432/finance_app
```

The app reads `.env` from the current package or nearby workspace directories. `DATABASE_URL` is the only required variable for the default local setup.

## Development

Run the API and web app in separate terminals:

```bash
corepack pnpm api:dev
corepack pnpm web:dev
```

Then open:

```text
http://localhost:5173
```

The Vite dev server proxies `/api` and `/health` to `http://127.0.0.1:4000` by default. Set `VITE_API_PROXY_TARGET` if the API is running somewhere else.

Useful commands:

```bash
corepack pnpm typecheck
corepack pnpm api:test
corepack pnpm web:build
corepack pnpm db:down
```

## Local Wi-Fi Access

To build the web app and serve it from the API on your local network:

```bash
corepack pnpm app:lan
```

This binds the API to `0.0.0.0`, serves `apps/web/dist`, and logs Bonjour/IP URLs such as:

```text
http://HOSTNAME.local:4000
```

For hot-reload development from another device, run:

```bash
corepack pnpm api:dev
corepack pnpm web:dev:lan
```

Then open the Vite LAN URL on the other device.

## Importing Data

The script importer currently reads CSV-like files, despite the historical `import-excel.ts` name. The parser accepts comma or semicolon delimiters, finds the real header row, and maps rows into a shared transaction shape.

```bash
corepack pnpm import:sample
corepack pnpm import:sample -- packages/importer/src/data/transactions-main.csv --account shared
```

Expected columns include:

```text
date, amount, description, category, subcategory, type, bankConcept
```

The importer normalizes dates and amounts, keeps expense/income amounts positive, creates categories and subcategories as needed, records source imports, and skips duplicates. Accounts are `mine`, `shared`, `kids`, and `splitwise`; the default is `mine`.

Private finance files belong under `packages/importer/src/data/`, which is intentionally ignored by Git.

## Import Assistant

The web app includes a low-visibility utility route:

```text
/tools/import-assistant
```

Upload a bank PDF or spreadsheet there to preview extracted rows, compare them with historical transactions, edit suggestions, mark rows as reviewed/skipped, and export a CSV for review. The assistant previews and exports; it does not directly persist the uploaded source file or import rows into the database.

## App Routes

- `/` - dashboard
- `/cockpit` and `/cockpit/:subjectSlug` - subject-focused summaries and detail views
- `/analytics` - category and cashflow analytics
- `/projection` - 12-month projection from recent history and configured income sources
- `/upcoming` - payment reminders and detected recurring-payment candidates
- `/transactions` - searchable transaction list
- `/tools/import-assistant` - upload and review helper

## API Surface

The API listens on port `4000` by default and exposes:

- `GET /health`
- `GET /api/categories`
- `GET /api/transactions`
- `GET /api/reports/monthly-cashflow`
- `GET /api/reports/income-vs-expenses`
- `GET /api/reports/category-spend`
- `GET /api/reports/projection`
- `GET /api/cockpit/subjects`
- `GET /api/cockpit/subjects/:slug`
- `POST /api/imports/pdf-preview`
- `POST /api/imports/spreadsheet-preview`
- `GET /api/payment-reminders`
- `GET /api/payment-reminders/upcoming`
- `GET /api/payment-reminders/candidates`
- `POST /api/payment-reminders`
- `PATCH /api/payment-reminders/:id`
- `DELETE /api/payment-reminders/:id`
- `POST /api/payment-reminders/candidates/dismiss`
- `POST /api/payment-reminders/:id/occurrences/:dueDate/mark-paid`
- `POST /api/payment-reminders/:id/occurrences/:dueDate/skip`

Most report and transaction endpoints accept account/date filters. Shared-style accounts (`shared`, `kids`, and `splitwise`) count as a half-share in personal reporting totals.

## Analytics Scripts

```bash
corepack pnpm analyze:monthly
corepack pnpm analyze:yearly
corepack pnpm analyze:categories
corepack pnpm analyze:descriptions
corepack pnpm analyze:merchants
```

These read from PostgreSQL and print tables in the terminal.

## Database

Core tables:

- `expenses`
- `income`
- `categories`
- `subcategories`
- `imports`
- `payment_reminders`
- `payment_reminder_occurrences`
- `payment_reminder_dismissed_suggestions`
- `schema_migrations`

Transaction tables store dates, positive decimal amounts, descriptions, bank concepts, account, category/subcategory references, import source, and timestamps. Categories are mandatory; subcategories are optional and protected by category-aware foreign keys.

Run migrations with:

```bash
corepack pnpm db:migrate
```
