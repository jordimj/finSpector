import type { PaymentReminderOccurrence } from '@finance/shared';
import { CategoriesCard } from '../../../../components/CategoriesCard';
import { IncomeVsExpensesCard } from '../../../../components/IncomeVsExpensesCard';
import type { IncomeVsExpenses } from '../../../../hooks/useIncomeVsExpenses';
import type { CategorySpendResult } from '../../utils/subjectDetailAdapters';
import { UpcomingPanel } from './UpcomingPanel';

type MixedSubjectSectionsProps = {
  cashflow?: IncomeVsExpenses;
  expenseBreakdown: CategorySpendResult;
  incomeBreakdown: CategorySpendResult;
  isError: boolean;
  isLoading: boolean;
  periodLabel: string;
  subjectName: string;
  upcomingOccurrences: PaymentReminderOccurrence[];
};

export function MixedSubjectSections({
  cashflow,
  expenseBreakdown,
  incomeBreakdown,
  isError,
  isLoading,
  periodLabel,
  subjectName,
  upcomingOccurrences,
}: MixedSubjectSectionsProps) {
  return (
    <>
      <div className='mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]'>
        <IncomeVsExpensesCard
          data={cashflow}
          expenseLabel={`${subjectName} expenses`}
          isError={isError}
          isLoading={isLoading}
          scopedExpenseComparison
        />

        <CategoriesCard
          amountLabel='Expenses'
          categories={expenseBreakdown.items}
          emptyDescription='Matching expenses will show up here.'
          isError={isError}
          isLoading={isLoading}
          itemLabel='Expense line'
          periodLabel={periodLabel}
          title='Expense breakdown'
          total={expenseBreakdown.total}
          totalVerb='spent'
          type='expense'
        />
      </div>

      <div className='mt-5 grid gap-5 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]'>
        <CategoriesCard
          amountLabel='Income'
          categories={incomeBreakdown.items}
          emptyDescription='Matching income will show up here.'
          isError={isError}
          isLoading={isLoading}
          itemLabel='Income line'
          periodLabel={periodLabel}
          title='Income breakdown'
          total={incomeBreakdown.total}
          totalVerb='received'
          type='income'
        />

        <UpcomingPanel
          isError={isError}
          isLoading={isLoading}
          occurrences={upcomingOccurrences}
        />
      </div>
    </>
  );
}
