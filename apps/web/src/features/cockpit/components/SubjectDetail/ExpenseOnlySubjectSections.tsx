import type { PaymentReminderOccurrence } from '@finance/shared';
import { CategoriesCard } from '../../../../components/CategoriesCard';
import type { CategorySpendResult } from '../../utils/subjectDetailAdapters';
import { ExpensePieCard } from './ExpensePieCard';
import { UpcomingPanel } from './UpcomingPanel';

type ExpenseOnlySubjectSectionsProps = {
  expenseSubcategoryBreakdown: CategorySpendResult;
  isError: boolean;
  isLoading: boolean;
  periodLabel: string;
  upcomingOccurrences: PaymentReminderOccurrence[];
};

export function ExpenseOnlySubjectSections({
  expenseSubcategoryBreakdown,
  isError,
  isLoading,
  periodLabel,
  upcomingOccurrences,
}: ExpenseOnlySubjectSectionsProps) {
  return (
    <>
      <div className='mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]'>
        <ExpensePieCard
          categories={expenseSubcategoryBreakdown.items}
          isError={isError}
          isLoading={isLoading}
          periodLabel={periodLabel}
          total={expenseSubcategoryBreakdown.total}
        />

        <UpcomingPanel
          isError={isError}
          isLoading={isLoading}
          occurrences={upcomingOccurrences}
        />
      </div>

      <div className='mt-5'>
        <CategoriesCard
          amountLabel='Expenses'
          categories={expenseSubcategoryBreakdown.items}
          emptyDescription='Matching subcategory expenses will show up here.'
          isError={isError}
          isLoading={isLoading}
          itemLabel='Subcategory'
          periodLabel={periodLabel}
          title='Subcategory breakdown'
          total={expenseSubcategoryBreakdown.total}
          totalVerb='spent'
          type='expense'
        />
      </div>
    </>
  );
}
