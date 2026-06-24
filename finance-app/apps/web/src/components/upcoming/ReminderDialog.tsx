import type { PaymentReminder } from '@finance/shared';
import { X } from 'lucide-react';
import type { FormEvent } from 'react';
import { ReminderEditor } from './ReminderEditor';
import type { CategoryOption, ReminderFormState } from './reminderForm';

export function ReminderDialog({
  categoryOptions,
  editingReminder,
  formState,
  isCategoryLoading,
  isOpen,
  isSaving,
  onCancel,
  onChange,
  onSubmit,
}: {
  categoryOptions: CategoryOption[];
  editingReminder: PaymentReminder | null;
  formState: ReminderFormState;
  isCategoryLoading: boolean;
  isOpen: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onChange: (updater: (current: ReminderFormState) => ReminderFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 py-6'>
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='payment-reminder-dialog-title'
        className='flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-shell'
      >
        <div className='flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4'>
          <div>
            <h2
              id='payment-reminder-dialog-title'
              className='text-xl font-semibold tracking-normal text-ink'
            >
              {editingReminder === null ? 'New reminder' : 'Edit reminder'}
            </h2>
            <p className='mt-1 text-sm font-medium text-muted'>
              Create a scheduled expense payment
            </p>
          </div>
          <button
            type='button'
            className='flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-panel-raised text-muted-strong transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
            aria-label='Close reminder dialog'
            onClick={onCancel}
          >
            <X className='size-4' aria-hidden='true' />
          </button>
        </div>

        <div className='min-h-0 overflow-y-auto px-5 py-5'>
          <ReminderEditor
            categoryOptions={categoryOptions}
            editingReminder={editingReminder}
            formState={formState}
            isCategoryLoading={isCategoryLoading}
            isSaving={isSaving}
            onChange={onChange}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </div>
  );
}
