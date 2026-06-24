import type { PaymentReminder } from '@finance/shared';
import { Pencil, Trash2 } from 'lucide-react';
import { formatTransactionCurrency } from '../../utils';
import { EmptyState, LoadingState } from './PanelStates';
import { formatCadenceLabel } from './reminderUi';

export function ActiveRemindersPanel({
  isLoading,
  onDeactivate,
  onEdit,
  pending,
  reminders,
}: {
  isLoading: boolean;
  onDeactivate: (reminder: PaymentReminder) => void;
  onEdit: (reminder: PaymentReminder) => void;
  pending: boolean;
  reminders: PaymentReminder[];
}) {
  return (
    <section className='rounded-lg border border-line bg-panel p-5 shadow-shell'>
      <h2 className='text-xl font-semibold tracking-normal text-ink'>
        Active reminders
      </h2>
      <p className='mt-1 text-sm font-medium text-muted'>
        Scheduled payment rules
      </p>

      {isLoading ? (
        <LoadingState label='Loading reminders' compact />
      ) : reminders.length === 0 ? (
        <EmptyState
          compact
          description='Create or confirm a reminder to start tracking due dates.'
          title='No reminders'
        />
      ) : (
        <div className='mt-4 space-y-2'>
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className='flex items-center justify-between gap-3 rounded-md bg-canvas/70 px-3 py-2'
            >
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold text-ink'>
                  {reminder.name}
                </p>
                <p className='mt-0.5 text-xs font-medium text-muted'>
                  {formatCadenceLabel(reminder.cadence)} · Day{' '}
                  {reminder.dueDay} ·{' '}
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
          ))}
        </div>
      )}
    </section>
  );
}
