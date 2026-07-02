# AGENTS.MD

Working guide for agents in `/Users/jmiro/Documents/budget`.

The actual app lives in `finance-app/`. Treat the repository root as a wrapper and run project commands from `finance-app/` unless a task explicitly says otherwise.

## Product Intent

FinHunter is a local-first personal finance app. It imports and previews transaction exports, stores normalized expenses/income in local PostgreSQL, and exposes a React dashboard backed by a Fastify API.

Current product surface:

- dashboard, cockpit subjects, analytics, projections, upcoming payments, and transactions
- account filtering for `mine`, `shared`, `kids`, and `splitwise`
- payment reminders with manual reminders, detected candidates, due/overdue states, and paid/skipped overrides
- import assistant for PDF/spreadsheet previews, category suggestions, row review, local draft recovery, and review CSV export
- script-based imports and analytics for the local database
- PWA assets and LAN serving for phone/tablet access on local Wi-Fi

Frontend, API, reminders, and PWA support already exist. Do not describe them as future work. Auth, cloud sync, and AI assistance are not implemented; do not add them unless the user explicitly asks.

## User Preferences

- Prefer simple, typed, understandable code over clever abstractions.
- Keep changes scoped to the requested behavior. Future-proof when it is cheap, but do not overbuild.
- Preserve private finance data and user-created import files. Never delete, rename, reformat, or print real data unless explicitly asked.
- Leave unrelated dirty files alone. Mention them only when relevant to the task.
- Answer database/schema questions from the actual code and migrations, not generic advice.
- Verify docs against the repo before repeating them; README and this guide can lag behind code.
- Keep project docs useful without turning them into exhaustive handbooks.
- If the user asks for planning or says not to edit, stay in analysis/recommendation mode.

## Repository Map

```text
finance-app/
  apps/
    api/        Fastify API, route modules, domain helpers, tests
    web/        React/Vite app, PWA assets, Tailwind UI

  packages/
    analytics/  Local reporting scripts
    db/         PostgreSQL client, Drizzle schema, SQL migrations
    importer/   CSV-like script import pipeline
    shared/     Shared constants, helpers, and TypeScript types
```

There is also an ignored `finance-app/.agents/skills/` directory with project-local guidance for Drizzle, Node, TypeScript, Vite, React, Tailwind, accessibility, and frontend design. Consult those files when relevant, but treat tracked source as the final authority if guidance is stale.

## Stack

- pnpm workspace pinned through Corepack
- TypeScript, ESM, `NodeNext`, `strict`, and `noUncheckedIndexedAccess`
- React, Vite, React Router, TanStack Query, Tailwind CSS, lucide-react, Recharts, and vite-plugin-pwa
- Fastify with CORS, Helmet, sensible errors, route schemas, and `node:test`
- PostgreSQL via Docker Compose
- Drizzle ORM schema definitions plus hand-written SQL migrations
- Node/tsx scripts for imports and analytics

Use `corepack pnpm ...` in commands. Bare `pnpm` may not be available on PATH.

## Commands

From `finance-app/`:

```bash
corepack pnpm install
corepack pnpm typecheck

corepack pnpm api:dev
corepack pnpm api:test
corepack pnpm api:start

corepack pnpm web:dev
corepack pnpm web:dev:lan
corepack pnpm web:build
corepack pnpm web:preview
corepack pnpm web:preview:lan
corepack pnpm app:lan

corepack pnpm db:up
corepack pnpm db:down
corepack pnpm db:migrate

corepack pnpm import:sample
corepack pnpm import:sample -- packages/importer/src/data/transactions-main.csv --account shared

corepack pnpm analyze:monthly
corepack pnpm analyze:yearly
corepack pnpm analyze:categories
corepack pnpm analyze:descriptions
corepack pnpm analyze:merchants
```

Default database URL:

```text
postgres://finance:finance@localhost:5432/finance_app
```

`tsx` commands may hit local IPC/sandbox restrictions in Codex. If an important command fails for that reason, rerun the same command with the proper escalation rather than changing app code.

## Current Architecture Notes

- `apps/web/src/App.tsx` defines the routes under `AppShell`: `/`, `/cockpit`, `/cockpit/:subjectSlug`, `/analytics`, `/projection`, `/upcoming`, `/transactions`, and `/tools/import-assistant`.
- `AppShell` owns the global account filter and transaction search entry point. Keep account-aware pages/hooks connected to that context.
- Web data access goes through TanStack Query hooks and `fetchJson`; prefer adding focused hooks over fetch calls inside visual components.
- `apps/api/src/app.ts` wires Fastify plugins, `/health`, API route modules, optional static web serving through `WEB_DIST_DIR`, and centralized error handling.
- API route modules should stay domain-level, not raw table passthroughs. Existing domains include categories, cockpit, imports, payment reminders, reports, and transactions.
- Payment reminder logic is split across candidates, occurrences, repositories, serializers, validation, and route wiring. Preserve that separation for reminder changes.
- Reporting endpoints intentionally use SQL where it keeps cashflow/category/projection logic direct and inspectable.

## Database Invariants

Keep Drizzle schema and SQL migrations aligned.

- Transaction-like records (`expenses`, `income`, `imports`, reminder records) use UUID primary keys.
- Taxonomy records (`categories`, `subcategories`) use integer identity primary keys.
- Categories are mandatory for expenses, income, and payment reminders.
- Subcategories are optional, but category-aware foreign keys prevent a subcategory from being attached to the wrong category.
- `expenses` and `income` both store `date`, positive decimal `amount`, `description`, `bank_concept`, `account`, category/subcategory IDs, source import, and timestamps.
- Expense accounts are `mine`, `shared`, `kids`, and `splitwise`; default is `mine`.
- `shared`, `kids`, and `splitwise` count as half-share accounts in personal reporting totals. Use shared helpers such as `getPersonalTransactionAmount` instead of reimplementing the rule.
- Payment reminders are first-class schema: reminders, occurrence overrides, dismissed suggestions, cadences, sources, and paid/skipped occurrence statuses.
- Be careful with migrations that may already have run locally. If editing old migrations is unavoidable, explain the local DB impact.

Do not switch this project to Prisma. Drizzle plus SQL is an intentional fit for this repo.

## Import And Data Rules

`packages/importer/src/data/` contains private local finance files and is ignored by Git. Treat it as sensitive.

Script importer:

- The script is still named `import-excel.ts`, but it currently reads CSV-like files through `parse-excel.ts`.
- The default path is `packages/importer/src/data/transactions-main.csv`.
- Keep bank/source-specific column mapping at the parser boundary.
- Current parser accepts comma or semicolon delimited files and can skip rows before the real headers.
- Expected raw fields include `date`, `amount`, `description`, `bankConcept`, `category`, `subcategory`, and `type`.
- Normalization converts dates to `YYYY-MM-DD`, localized Euro-style amounts to positive decimal strings, blank optional text to `undefined`, missing categories to `Uncategorized`, and type from explicit value or amount sign.
- Duplicate checks currently compare date, amount, account, category, subcategory, and description for both expenses and income.

Import assistant:

- The route is `/tools/import-assistant`; API previews are under `/api/imports/pdf-preview` and `/api/imports/spreadsheet-preview`.
- It previews uploaded PDF/spreadsheet files, suggests categories from history, supports row edits/skips/review status, and exports review CSVs.
- It saves review drafts in browser `localStorage`; handle unavailable storage defensively.
- It does not directly persist uploaded source files or import rows into PostgreSQL.
- Preserve the Splitwise preview rule that flags exact-amount Splitwise history within a 14-day window.

## Frontend Style

- Build operational finance screens, not marketing pages. The first screen should be useful app UI.
- Use the existing dark Tailwind theme tokens from `apps/web/src/styles.css`; avoid one-off palettes unless the feature clearly needs them.
- Prefer dense, scan-friendly layouts with clear headings, filters, tables, charts, summary tiles, loading states, empty states, and error notices.
- Use lucide icons for navigation/actions when an icon exists.
- Keep page-level layout under `AppShell`; add focused components/hooks for complex sections.
- Keep controls ergonomic: date range presets, account filters, selects, inputs, toggles, and icon buttons should match existing patterns.
- Avoid nested card-in-card layouts and decorative hero/landing-page treatment.
- Ensure text fits on mobile and desktop. Use stable grid/width constraints for tables, charts, toolbar controls, and repeated rows.
- For frontend changes, check responsive behavior and visual states when practical; run `corepack pnpm web:build` for meaningful UI/type changes.

## Backend Style

- Keep Fastify route handlers small enough to read; push domain behavior into helpers, repositories, serializers, and validators.
- Add route schemas for params/query/body validation.
- Return domain-shaped responses that the web app can consume directly.
- Use `@finance/shared` constants/types for account, transaction type, reminder cadence, and cockpit subject values.
- Use parameterized SQL for report/query endpoints. Do not build SQL from unchecked user input.
- Close Fastify/db resources in tests.
- Existing API tests use `node:test`, `assert/strict`, and Fastify `inject`; follow that pattern.

## TypeScript And Code Style

- Keep TypeScript strict and strongly typed.
- Account for `noUncheckedIndexedAccess`: guard array indexing, regex captures, optional CLI args, and parsed external data.
- No `any` unless there is a clear reason.
- Prefer small named helpers, early returns, and explicit normalization/serialization boundaries.
- Avoid broad refactors and style churn.
- Follow the quote/import/formatting style of the file being edited; older importer files may differ from newer app files.
- Add comments only for important boundaries or non-obvious behavior.
- Keep package ownership clear:
  - `db` owns connection, schema, and migrations
  - `shared` owns shared constants, helpers, and wire/domain types
  - `importer` owns script parsing, normalization, validation, and inserts
  - `analytics` owns terminal reporting scripts
  - `api` owns HTTP routes and backend domain behavior
  - `web` owns UI, hooks, and browser-local state

## Verification Expectations

Choose verification based on the change:

- Docs only: read the edited doc and run `git diff --check -- <file>`.
- General code: `corepack pnpm typecheck`.
- API/domain behavior: `corepack pnpm api:test`, or the narrower package command when useful.
- Web changes: `corepack pnpm web:build`.
- Database/import changes: consider `corepack pnpm db:up`, `corepack pnpm db:migrate`, `corepack pnpm import:sample`, and relevant analytics scripts.
- LAN/PWA/static-serving changes: consider `corepack pnpm app:lan` or `web:preview:lan` only when local serving behavior matters.

Only run the full DB loop when relevant; it starts or uses local Docker/Postgres.

## Common Pitfalls

- The app root is `finance-app/`, not the repository root.
- `AGENTS.MD` may be staged or dirty; do not change staging unless the user asks.
- README or guide content can lag behind code. Verify source before updating docs.
- Private data in `packages/importer/src/data/` is ignored; do not expose or tidy it casually.
- The current script importer default is `transactions-main.csv`.
- Frontend/API/reminders/PWA are current product areas, not future plans.
- Do not remove `expenses.category_id` or `income.category_id`; category is required even when subcategory is null.
- When touching shared account math, preserve the half-share treatment for `shared`, `kids`, and `splitwise`.
