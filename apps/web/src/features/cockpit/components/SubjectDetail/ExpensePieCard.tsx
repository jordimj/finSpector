import { CategorySpendChart } from '../../../../components/CategorySpendChart';
import type { CategorySpend } from '../../../../hooks/useCategorySpend';
import { formatCurrency } from '../../../../utils';

type ExpensePieCardProps = {
  categories: CategorySpend[];
  isError: boolean;
  isLoading: boolean;
  periodLabel: string;
  total: number;
};

export function ExpensePieCard({
  categories,
  isError,
  isLoading,
  periodLabel,
  total,
}: ExpensePieCardProps) {
  return (
    <section className='rounded-lg border border-line bg-panel p-5 shadow-shell'>
      <div className='mb-5'>
        <h2 className='text-xl font-semibold tracking-normal text-ink'>
          Subcategory mix
        </h2>
        <p className='mt-1 text-sm font-medium text-muted'>
          {isLoading ? 'Loading totals' : `${formatCurrency(total)} spent`} ·{' '}
          {periodLabel}
        </p>
      </div>

      <CategorySpendChart
        categories={categories}
        emptyDescription='Matching expenses will show up here.'
        emptyTitle='No subcategories yet'
        isError={isError}
        isLoading={isLoading}
        metricLabel='Spent'
        shareLabel='expenses'
        total={total}
      />
    </section>
  );
}
