import type {
  ExpenseAccount,
  PaymentCadence,
  PaymentReminder,
} from '@finance/shared';
import { Check, Loader2, Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { cn } from '../../lib/utils';
import {
  accountOptions,
  cadenceOptions,
  type CategoryOption,
  type ReminderFormState,
} from './reminderForm';

export function ReminderEditor({
  categoryOptions,
  editingReminder,
  formState,
  isCategoryLoading,
  isSaving,
  onChange,
  onSubmit,
}: {
  categoryOptions: CategoryOption[];
  editingReminder: PaymentReminder | null;
  formState: ReminderFormState;
  isCategoryLoading: boolean;
  isSaving: boolean;
  onChange: (updater: (current: ReminderFormState) => ReminderFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const selectedCategoryValue =
    formState.categoryValue || categoryOptions[0]?.value || '';
  const isOneTime = formState.cadence === 'oneTime';

  return (
    <form className='space-y-3' onSubmit={onSubmit}>
      <label className='block'>
        <span className='mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-muted-strong'>
          Name
        </span>
        <input
          className='h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm font-semibold text-ink outline-none transition focus:border-accent-lavender'
          required
          value={formState.name}
          onChange={(event) => {
            const { value } = event.currentTarget;

            onChange((current) => ({
              ...current,
              name: value,
            }));
          }}
        />
      </label>

      <div
        className={cn(
          'grid gap-3',
          isOneTime ? 'sm:grid-cols-1' : 'sm:grid-cols-2',
        )}
      >
        <label className='block'>
          <span className='mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-muted-strong'>
            Amount
          </span>
          <input
            className='h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm font-semibold text-ink outline-none transition focus:border-accent-lavender'
            min='0.01'
            required
            step='0.01'
            type='number'
            value={formState.amount}
            onChange={(event) => {
              const { value } = event.currentTarget;

              onChange((current) => ({
                ...current,
                amount: value,
              }));
            }}
          />
        </label>

        {isOneTime ? null : (
          <label className='block'>
            <span className='mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-muted-strong'>
              Match tolerance
            </span>
            <input
              className='h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm font-semibold text-ink outline-none transition focus:border-accent-lavender'
              min='0'
              step='0.01'
              type='number'
              value={formState.amountTolerance}
              onChange={(event) => {
                const { value } = event.currentTarget;

                onChange((current) => ({
                  ...current,
                  amountTolerance: value,
                }));
              }}
            />
          </label>
        )}
      </div>

      <div className='grid gap-3 sm:grid-cols-2'>
        <label className='block'>
          <span className='mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-muted-strong'>
            Account
          </span>
          <select
            className='h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm font-semibold text-ink outline-none transition focus:border-accent-lavender'
            value={formState.account}
            onChange={(event) => {
              const value = event.currentTarget.value as ExpenseAccount;

              onChange((current) => ({
                ...current,
                account: value,
              }));
            }}
          >
            {accountOptions.map((account) => (
              <option key={account.value} value={account.value}>
                {account.label}
              </option>
            ))}
          </select>
        </label>

        <label className='block'>
          <span className='mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-muted-strong'>
            Category
          </span>
          <select
            className='h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm font-semibold text-ink outline-none transition focus:border-accent-lavender disabled:cursor-not-allowed disabled:opacity-60'
            disabled={isCategoryLoading || categoryOptions.length === 0}
            value={selectedCategoryValue}
            onChange={(event) => {
              const { value } = event.currentTarget;

              onChange((current) => ({
                ...current,
                categoryValue: value,
              }));
            }}
          >
            {isCategoryLoading ? (
              <option>Loading categories...</option>
            ) : categoryOptions.length === 0 ? (
              <option>No categories available</option>
            ) : (
              categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            )}
          </select>
        </label>
      </div>

      <div
        className={cn(
          'grid gap-3 sm:grid-cols-2',
          isOneTime ? 'lg:grid-cols-3' : 'lg:grid-cols-4',
        )}
      >
        <label className='block'>
          <span className='mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-muted-strong'>
            Cadence
          </span>
          <select
            className='h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm font-semibold text-ink outline-none transition focus:border-accent-lavender'
            value={formState.cadence}
            onChange={(event) => {
              const value = event.currentTarget.value as PaymentCadence;

              onChange((current) => ({
                ...current,
                cadence: value,
              }));
            }}
          >
            {cadenceOptions.map((cadence) => (
              <option key={cadence.value} value={cadence.value}>
                {cadence.label}
              </option>
            ))}
          </select>
        </label>

        <label className='block'>
          <span className='mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-muted-strong'>
            {isOneTime ? 'Due date' : 'Start'}
          </span>
          <input
            className='h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm font-semibold text-ink outline-none transition focus:border-accent-lavender'
            required
            type='date'
            value={formState.startDate}
            onChange={(event) => {
              const { value } = event.currentTarget;

              onChange((current) => ({
                ...current,
                startDate: value,
              }));
            }}
          />
        </label>

        {isOneTime ? null : (
          <label className='block'>
            <span className='mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-muted-strong'>
              Due day
            </span>
            <input
              className='h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm font-semibold text-ink outline-none transition focus:border-accent-lavender'
              max='31'
              min='1'
              required
              type='number'
              value={formState.dueDay}
              onChange={(event) => {
                const { value } = event.currentTarget;

                onChange((current) => ({
                  ...current,
                  dueDay: value,
                }));
              }}
            />
          </label>
        )}

        <label className='block'>
          <span className='mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-muted-strong'>
            Lead days
          </span>
          <input
            className='h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm font-semibold text-ink outline-none transition focus:border-accent-lavender'
            max='30'
            min='0'
            type='number'
            value={formState.leadDays}
            onChange={(event) => {
              const { value } = event.currentTarget;

              onChange((current) => ({
                ...current,
                leadDays: value,
              }));
            }}
          />
        </label>
      </div>

      <label className='block'>
        <span className='mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-muted-strong'>
          Match text
        </span>
        <input
          className='h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm font-semibold text-ink outline-none transition focus:border-accent-lavender'
          value={formState.matchText}
          onChange={(event) => {
            const { value } = event.currentTarget;

            onChange((current) => ({
              ...current,
              matchText: value,
            }));
          }}
        />
      </label>

      <button
        type='submit'
        className='inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-line bg-panel-raised px-4 text-sm font-semibold text-muted-strong transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-50'
        disabled={isSaving || categoryOptions.length === 0}
      >
        {isSaving ? (
          <Loader2 className='size-4 animate-spin' aria-hidden='true' />
        ) : editingReminder === null ? (
          <Plus className='size-4' aria-hidden='true' />
        ) : (
          <Check className='size-4' aria-hidden='true' />
        )}
        {editingReminder === null ? 'Create reminder' : 'Save reminder'}
      </button>
    </form>
  );
}
