import {
  Banknote,
  CalendarClock,
  ReceiptText,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { CockpitSubjectDetail, CockpitSubjectSlug } from '@finance/shared';
import { SummaryTile } from '../../../../components/SummaryTile';
import { formatCurrency } from '../../../../utils';
import {
  isExpenseOnlySubject,
  isIncomeOnlySubject,
} from '../../utils/cockpitSubjects';

type SubjectSummaryTilesProps = {
  isLoading: boolean;
  slug: CockpitSubjectSlug;
  subject?: CockpitSubjectDetail;
};

export function SubjectSummaryTiles({
  isLoading,
  slug,
  subject,
}: SubjectSummaryTilesProps) {
  const isExpenseOnly = isExpenseOnlySubject(slug);
  const isIncomeOnly = isIncomeOnlySubject(slug);
  const incomeTotal = Number(subject?.totals.income ?? 0);
  const expensesTotal = Number(subject?.totals.expenses ?? 0);
  const netTotal = Number(subject?.totals.net ?? 0);
  const hasSurplus = netTotal >= 0;
  const NetIcon = hasSurplus ? TrendingUp : TrendingDown;

  return (
    <div
      className={
        isExpenseOnly
          ? 'grid gap-5 md:grid-cols-2'
          : isIncomeOnly
            ? 'grid gap-5 md:grid-cols-2'
            : 'grid gap-5 md:grid-cols-2 xl:grid-cols-4'
      }
    >
      {isExpenseOnly ? null : (
        <SummaryTile
          badge='Income'
          detail='Matching income'
          footer='Period total'
          icon={<Banknote className='size-5' aria-hidden='true' />}
          label='Income'
          tone='green'
          value={isLoading ? '...' : formatCurrency(incomeTotal)}
        />
      )}
      {isIncomeOnly ? null : (
        <SummaryTile
          badge='Expenses'
          detail='Matching expenses'
          footer='Period total'
          icon={<ReceiptText className='size-5' aria-hidden='true' />}
          label='Expenses'
          tone='lavender'
          value={isLoading ? '...' : formatCurrency(expensesTotal)}
        />
      )}
      {isExpenseOnly || isIncomeOnly ? null : (
        <SummaryTile
          badge={hasSurplus ? 'Surplus' : 'Deficit'}
          detail={hasSurplus ? 'Income less expenses' : 'Expenses over income'}
          footer='Net'
          icon={<NetIcon className='size-5' aria-hidden='true' />}
          label='Net'
          tone={hasSurplus ? 'green' : 'rose'}
          value={isLoading ? '...' : formatCurrency(netTotal)}
        />
      )}
      <SummaryTile
        badge='Upcoming'
        detail={`${subject?.upcoming.count ?? 0} scoped reminder${
          subject?.upcoming.count === 1 ? '' : 's'
        }`}
        footer='Scheduled'
        icon={<CalendarClock className='size-5' aria-hidden='true' />}
        label='Upcoming'
        tone='lavender'
        value={
          isLoading
            ? '...'
            : formatCurrency(Number(subject?.upcoming.total ?? 0))
        }
      />
    </div>
  );
}
