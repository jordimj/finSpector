import type { CategorySpendCategory } from '../types';
import { CategorySpendChart } from './CategorySpendChart';

type ExpenseBreakdownCardProps = {
  categories: CategorySpendCategory[];
  isError: boolean;
  isLoading: boolean;
  periodLabel: string;
  total: number;
};

export function ExpenseBreakdownCard({
  categories,
  isError,
  isLoading,
  periodLabel,
  total,
}: ExpenseBreakdownCardProps) {
  return (
    <div className='flex flex-col rounded-lg border border-line bg-panel p-5'>
      <div className='mb-5 flex items-center justify-between gap-3'>
        <h2 className='text-sm font-semibold text-ink'>Expense breakdown</h2>
        <span className='text-xs font-medium text-muted'>{periodLabel}</span>
      </div>

      <CategorySpendChart
        categories={categories}
        isError={isError}
        isLoading={isLoading}
        total={total}
      />
    </div>
  );
}
