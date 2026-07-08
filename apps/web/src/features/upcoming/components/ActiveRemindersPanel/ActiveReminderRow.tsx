import type { PaymentReminder } from '@finance/shared';
import { Pencil, Trash2 } from 'lucide-react';
import { formatTransactionCurrency } from '../../../../utils';
import { formatCadenceLabel } from '../../utils/reminderUi';

export function ActiveReminderRow({
  onDeactivate,
  onEdit,
  pending,
  reminder,
}: {
  onDeactivate: (reminder: PaymentReminder) => void;
  onEdit: (reminder: PaymentReminder) => void;
  pending: boolean;
  reminder: PaymentReminder;
}) {
  return (
    <div className='flex items-center justify-between gap-3 rounded-md bg-canvas/70 px-3 py-2'>
      <div className='min-w-0'>
        <p className='truncate text-sm font-semibold text-ink'>
          {reminder.name}
        </p>
        <p className='mt-0.5 text-xs font-medium text-muted'>
          {formatCadenceLabel(reminder.cadence)} · Day {reminder.dueDay} ·{' '}
          {formatTransactionCurrency(Number(reminder.amount))}
        </p>
      </div>
      <div className='flex shrink-0 gap-1'>
        <button
          type='button'
          className='flex size-8 items-center justify-center rounded-md border border-line bg-panel text-muted-strong transition hover:text-ink'
          aria-label={`Edit ${reminder.name}`}
          onClick={() => onEdit(reminder)}
        >
          <Pencil className='size-4' aria-hidden='true' />
        </button>
        <button
          type='button'
          className='flex size-8 items-center justify-center rounded-md border border-line bg-panel text-muted-strong transition hover:text-accent-rose disabled:cursor-not-allowed disabled:opacity-50'
          aria-label={`Remove ${reminder.name}`}
          disabled={pending}
          onClick={() => onDeactivate(reminder)}
        >
          <Trash2 className='size-4' aria-hidden='true' />
        </button>
      </div>
    </div>
  );
}
