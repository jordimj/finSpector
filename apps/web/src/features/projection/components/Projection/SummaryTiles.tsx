import {
  Banknote,
  PiggyBank,
  ReceiptText,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { SummaryTile } from '../../../../components/SummaryTile';
import { formatCurrency, formatPercentage } from '../../../../utils';

type SummaryTilesProps = {
  activeExclusionCount: number;
  expensesTotal: number;
  hasSurplus: boolean;
  incomeTotal: number;
  isLoading: boolean;
  netTotal: number;
  periodLabel: string;
  savingsRate: number | null | undefined;
};

export function SummaryTiles({
  activeExclusionCount,
  expensesTotal,
  hasSurplus,
  incomeTotal,
  isLoading,
  netTotal,
  periodLabel,
  savingsRate,
}: SummaryTilesProps) {
  const NetIcon = hasSurplus ? TrendingUp : TrendingDown;

  return (
    <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-4'>
      <SummaryTile
        badge='Projected'
        detail={periodLabel}
        footer='Income'
        icon={<Banknote className='size-5' aria-hidden='true' />}
        label='Projected income'
        tone='green'
        value={isLoading ? '...' : formatCurrency(incomeTotal)}
      />
      <SummaryTile
        badge='Editable'
        detail={`${activeExclusionCount} exclusions applied`}
        footer='Expenses'
        icon={<ReceiptText className='size-5' aria-hidden='true' />}
        label='Projected expenses'
        tone='lavender'
        value={isLoading ? '...' : formatCurrency(expensesTotal)}
      />
      <SummaryTile
        badge={hasSurplus ? 'Surplus' : 'Deficit'}
        detail={hasSurplus ? 'After expenses' : 'Over projected income'}
        footer='Net'
        icon={<NetIcon className='size-5' aria-hidden='true' />}
        label='Projected net'
        tone={hasSurplus ? 'green' : 'rose'}
        value={isLoading ? '...' : formatCurrency(netTotal)}
      />
      <SummaryTile
        badge='Rate'
        detail='Projected net / income'
        footer='Savings'
        icon={<PiggyBank className='size-5' aria-hidden='true' />}
        label='Savings rate'
        tone={hasSurplus ? 'green' : 'rose'}
        value={
          isLoading || savingsRate === null
            ? '--'
            : formatPercentage(savingsRate ?? 0)
        }
      />
    </div>
  );
}
