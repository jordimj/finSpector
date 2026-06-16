import { CalendarDays } from 'lucide-react';
import { CategoriesCard } from '../components/CategoriesCard';
import { ExpenseBreakdownCard } from '../components/ExpenseBreakdownCard';
import { useCategorySpend } from '../hooks/useCategorySpend';
import { formatDateRange } from '../utils';

export function AnalyticsPage() {
  const categorySpend = useCategorySpend();
  const categories = categorySpend.data?.categories ?? [];
  const total = categorySpend.data?.total ?? 0;
  const periodLabel =
    categorySpend.data === undefined
      ? 'This month'
      : formatDateRange(
          categorySpend.data.startDate,
          categorySpend.data.endDate,
        );

  return (
    <section className='mx-auto max-w-7xl'>
      <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-cyan'>
            Analytics
          </p>
          <h1 className='text-2xl font-semibold tracking-normal text-ink md:text-3xl'>
            Category spend
          </h1>
        </div>

        <button
          type='button'
          className='inline-flex h-9 items-center gap-2 rounded-md border border-line bg-panel px-3 text-sm font-medium text-muted-strong transition hover:bg-panel-raised hover:text-ink'
        >
          <CalendarDays className='size-4' aria-hidden='true' />
          This month
        </button>
      </div>

      <div className='grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(360px,1fr)]'>
        <ExpenseBreakdownCard
          categories={categories}
          isError={categorySpend.isError}
          isLoading={categorySpend.isLoading}
          periodLabel={periodLabel}
          total={total}
        />

        <CategoriesCard
          categories={categories}
          isError={categorySpend.isError}
          isLoading={categorySpend.isLoading}
          total={total}
        />
      </div>
    </section>
  );
}
