import type { ProjectionIncomeSource } from '../../hooks/useProjection';
import { getIncomeSourceRule } from '../../utils/assumptionDisplay';
import { formatTransactionCurrency } from '../../../../utils';

type ReadOnlyIncomeRowProps = {
  source: ProjectionIncomeSource;
};

export function ReadOnlyIncomeRow({ source }: ReadOnlyIncomeRowProps) {
  return (
    <div className='flex items-start justify-between gap-3 py-2.5'>
      <div className='min-w-0'>
        <p className='truncate text-sm font-semibold text-ink'>{source.name}</p>
        <p className='mt-0.5 truncate text-xs font-medium text-muted'>
          {getIncomeSourceRule(source)}
        </p>
      </div>
      <div className='shrink-0 text-right'>
        <p className='text-sm font-semibold tabular-nums text-ink'>
          {source.missing
            ? '--'
            : formatTransactionCurrency(Number(source.latestAmount))}
        </p>
        <p className='mt-0.5 text-xs font-semibold tabular-nums text-muted-strong'>
          {formatTransactionCurrency(Number(source.total))}
        </p>
      </div>
    </div>
  );
}
