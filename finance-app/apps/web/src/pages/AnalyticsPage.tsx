import { CalendarDays } from 'lucide-react';

const categoryRows = [
  'Housing',
  'Groceries',
  'Transport',
  'Restaurants',
  'Subscriptions',
];

export function AnalyticsPage() {
  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-cyan">
            Analytics
          </p>
          <h1 className="text-2xl font-semibold tracking-normal text-ink md:text-3xl">
            Category spend
          </h1>
        </div>

        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-panel px-3 text-sm font-medium text-muted-strong transition hover:bg-panel-raised hover:text-ink"
        >
          <CalendarDays className="size-4" aria-hidden="true" />
          This month
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(360px,1fr)]">
        <div className="rounded-lg border border-line bg-panel p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">
              Expense breakdown
            </h2>
            <span className="text-xs font-medium text-muted">Top categories</span>
          </div>
          <div className="flex aspect-square min-h-[280px] items-center justify-center rounded-md border border-dashed border-line bg-canvas">
            <div className="size-48 rounded-full border-[36px] border-accent-cyan/70 border-r-accent-green/80 border-t-accent-amber/80" />
          </div>
        </div>

        <div className="rounded-lg border border-line bg-panel">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">Categories</h2>
          </div>

          <div className="divide-y divide-line">
            {categoryRows.map((category, index) => (
              <div
                key={category}
                className="grid grid-cols-[minmax(0,1fr)_96px_72px] items-center gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {category}
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-canvas">
                    <div
                      className="h-full rounded-full bg-accent-green"
                      style={{ width: `${72 - index * 9}%` }}
                    />
                  </div>
                </div>
                <span className="text-right text-sm font-medium text-muted-strong">
                  --
                </span>
                <span className="text-right text-xs text-muted">-- tx</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
