import type { PaymentReminderOccurrence } from '@finance/shared';
import { CategoriesCard } from '../../../../components/CategoriesCard';
import { IncomeVsExpensesCard } from '../../../../components/IncomeVsExpensesCard';
import type { IncomeVsExpenses } from '../../../../hooks/useIncomeVsExpenses';
import type { CategorySpendResult } from '../../utils/subjectDetailAdapters';
import { UpcomingPanel } from './UpcomingPanel';

type IncomeOnlySubjectSectionsProps = {
  cashflow?: IncomeVsExpenses;
  incomeBreakdown: CategorySpendResult;
  isError: boolean;
  isLoading: boolean;
  periodLabel: string;
  subjectName: string;
  upcomingOccurrences: PaymentReminderOccurrence[];
};

export function IncomeOnlySubjectSections({
  cashflow,
  incomeBreakdown,
  isError,
  isLoading,
  periodLabel,
  subjectName,
  upcomingOccurrences,
}: IncomeOnlySubjectSectionsProps) {
  return (
    <>
      <div className='mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]'>
        <IncomeVsExpensesCard
          data={cashflow}
          displayMode='income-only'
          isError={isError}
          isLoading={isLoading}
          title={`${subjectName} income`}
        />

        <UpcomingPanel
          isError={isError}
          isLoading={isLoading}
          occurrences={upcomingOccurrences}
        />
      </div>

      <div className='mt-5'>
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
      </div>
    </>
  );
}
