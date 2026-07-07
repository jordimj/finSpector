import { formatCurrency } from '../../../../../utils';
import type { ScheduledPaymentRow } from '../../../utils/buildScheduledPaymentRows';

type ScheduledPaymentTileProps = {
  row: ScheduledPaymentRow;
};

export function ScheduledPaymentTile({ row }: ScheduledPaymentTileProps) {
  return (
    <div className='rounded-md border border-line bg-canvas/70 p-4'>
      <p className='text-sm font-semibold text-ink'>{row.label}</p>
      <p className='mt-3 text-xl font-bold tabular-nums text-ink'>
        {formatCurrency(row.amount)}
      </p>
      <p className='mt-1 text-sm font-medium text-muted'>
        {row.count} reminder{row.count === 1 ? '' : 's'}
      </p>
    </div>
  );
}
