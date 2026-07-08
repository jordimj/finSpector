import type { PaymentReminder } from '@finance/shared';
import { EmptyState } from '../PanelStates/EmptyState';
import { LoadingState } from '../PanelStates/LoadingState';
import { ActiveReminderRow } from './ActiveReminderRow';

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
        <div className='mt-4 max-h-[19rem] space-y-2 overflow-y-auto pr-1'>
          {reminders.map((reminder) => (
            <ActiveReminderRow
              key={reminder.id}
              onDeactivate={onDeactivate}
              onEdit={onEdit}
              pending={pending}
              reminder={reminder}
            />
          ))}
        </div>
      )}
    </section>
  );
}
