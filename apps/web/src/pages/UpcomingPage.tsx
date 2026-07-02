import {
  DEFAULT_PAYMENT_REMINDER_HORIZON_DAYS,
  type ExpenseAccount,
  type PaymentReminder,
  type PaymentReminderCandidate,
} from '@finance/shared';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ActiveRemindersPanel } from '../components/upcoming/ActiveRemindersPanel';
import { DetectedCandidatesPanel } from '../components/upcoming/DetectedCandidatesPanel';
import { PageNotice } from '../components/upcoming/PanelStates';
import { ReminderDialog } from '../components/upcoming/ReminderDialog';
import {
  buildCategoryOptions,
  createDefaultReminderFormState,
  createReminderFormStateFromReminder,
  toCandidatePaymentReminderInput,
  toPaymentReminderInput,
  type ReminderFormState,
} from '../components/upcoming/reminderForm';
import { isOpenOccurrence } from '../components/upcoming/reminderUi';
import { UpcomingOccurrencesPanel } from '../components/upcoming/UpcomingOccurrencesPanel';
import { UpcomingSummaryTiles } from '../components/upcoming/UpcomingSummaryTiles';
import { useAccountFilter } from '../hooks/useAccountFilter';
import { useCategories } from '../hooks/useCategories';
import { useCreatePaymentReminder } from '../hooks/paymentReminders/useCreatePaymentReminder';
import { useDeactivatePaymentReminder } from '../hooks/paymentReminders/useDeactivatePaymentReminder';
import { useDismissPaymentReminderCandidate } from '../hooks/paymentReminders/useDismissPaymentReminderCandidate';
import { useMarkPaymentOccurrencePaid } from '../hooks/paymentReminders/useMarkPaymentOccurrencePaid';
import { usePaymentReminderCandidates } from '../hooks/paymentReminders/usePaymentReminderCandidates';
import { usePaymentReminders } from '../hooks/paymentReminders/usePaymentReminders';
import { useSkipPaymentOccurrence } from '../hooks/paymentReminders/useSkipPaymentOccurrence';
import { useUpcomingPaymentReminders } from '../hooks/paymentReminders/useUpcomingPaymentReminders';
import { useUpdatePaymentReminder } from '../hooks/paymentReminders/useUpdatePaymentReminder';

export function UpcomingPage() {
  const { selectedAccount } = useAccountFilter();
  const upcoming = useUpcomingPaymentReminders();
  const reminders = usePaymentReminders();
  const candidates = usePaymentReminderCandidates();
  const categoriesQuery = useCategories('expense');
  const createReminder = useCreatePaymentReminder();
  const updateReminder = useUpdatePaymentReminder();
  const deactivateReminder = useDeactivatePaymentReminder();
  const dismissCandidate = useDismissPaymentReminderCandidate();
  const markPaid = useMarkPaymentOccurrencePaid();
  const skipOccurrence = useSkipPaymentOccurrence();
  const categoryOptions = useMemo(
    () => buildCategoryOptions(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );
  const [editingReminder, setEditingReminder] =
    useState<PaymentReminder | null>(null);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [formState, setFormState] = useState<ReminderFormState>(() =>
    createDefaultReminderFormState(selectedAccount),
  );
  const summary = upcoming.data?.summary;
  const occurrences = upcoming.data?.occurrences ?? [];
  const openOccurrences = occurrences.filter(isOpenOccurrence);
  const suggestionCount = candidates.data?.candidates.length ?? 0;
  const isSaving = createReminder.isPending || updateReminder.isPending;

  useEffect(() => {
    if (
      isReminderDialogOpen ||
      editingReminder !== null ||
      selectedAccount === null
    ) {
      return;
    }

    setFormState((current) => ({
      ...current,
      account: selectedAccount,
    }));
  }, [editingReminder, isReminderDialogOpen, selectedAccount]);

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input = toPaymentReminderInput(formState, categoryOptions);

    if (input === null) {
      return;
    }

    if (editingReminder === null) {
      createReminder.mutate(input, {
        onSuccess: () => resetForm(selectedAccount),
      });
      return;
    }

    updateReminder.mutate(
      {
        id: editingReminder.id,
        input: {
          ...input,
          source: editingReminder.source,
        },
      },
      {
        onSuccess: () => resetForm(selectedAccount),
      },
    );
  }

  function resetForm(account: ExpenseAccount | null) {
    setEditingReminder(null);
    setIsReminderDialogOpen(false);
    setFormState(createDefaultReminderFormState(account));
  }

  function handleAddReminderClick() {
    setEditingReminder(null);
    setFormState(createDefaultReminderFormState(selectedAccount));
    setIsReminderDialogOpen(true);
  }

  function handleEditReminder(reminder: PaymentReminder) {
    setEditingReminder(reminder);
    setFormState(createReminderFormStateFromReminder(reminder));
    setIsReminderDialogOpen(true);
  }

  function handleConfirmCandidate(candidate: PaymentReminderCandidate) {
    createReminder.mutate(toCandidatePaymentReminderInput(candidate));
  }

  return (
    <section className='mx-auto max-w-[1600px]'>
      <div className='mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-3xl font-semibold tracking-normal text-ink md:text-4xl'>
            Upcoming payments
          </h1>
          <div className='mt-3 flex flex-wrap items-center gap-3'>
            <span className='inline-flex h-6 items-center rounded-full bg-accent-cyan/15 px-3 text-xs font-bold uppercase tracking-[0.14em] text-accent-cyan'>
              Reminders
            </span>
            <span className='text-sm font-medium text-muted-strong'>
              Next {DEFAULT_PAYMENT_REMINDER_HORIZON_DAYS} days with due and
              overdue tracking
            </span>
          </div>
        </div>
        <button
          type='button'
          className='inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-panel-raised px-4 text-sm font-semibold text-muted-strong transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
          onClick={handleAddReminderClick}
        >
          <Plus className='size-4' aria-hidden='true' />
          Add new reminder
        </button>
      </div>

      {upcoming.isError || reminders.isError || candidates.isError ? (
        <PageNotice
          description='Check that the API is running and the payment reminder migration has been applied.'
          title='Payment reminders unavailable'
        />
      ) : null}

      <UpcomingSummaryTiles
        candidatesLoading={candidates.isLoading}
        suggestionCount={suggestionCount}
        summary={summary}
        upcomingLoading={upcoming.isLoading}
      />

      <div className='mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(24rem,0.65fr)]'>
        <UpcomingOccurrencesPanel
          isLoading={upcoming.isLoading}
          markPaidPending={markPaid.isPending}
          occurrences={openOccurrences}
          onMarkPaid={(occurrence) =>
            markPaid.mutate({
              dueDate: occurrence.dueDate,
              reminderId: occurrence.reminderId,
            })
          }
          onSkip={(occurrence) =>
            skipOccurrence.mutate({
              dueDate: occurrence.dueDate,
              reminderId: occurrence.reminderId,
            })
          }
          skipPending={skipOccurrence.isPending}
        />

        <div className='space-y-5'>
          <DetectedCandidatesPanel
            candidates={candidates.data?.candidates ?? []}
            isLoading={candidates.isLoading}
            onConfirm={handleConfirmCandidate}
            onDismiss={(candidate) => dismissCandidate.mutate(candidate.key)}
            pending={createReminder.isPending || dismissCandidate.isPending}
          />

          <ActiveRemindersPanel
            isLoading={reminders.isLoading}
            onDeactivate={(reminder) => deactivateReminder.mutate(reminder.id)}
            onEdit={handleEditReminder}
            pending={deactivateReminder.isPending}
            reminders={reminders.data?.reminders ?? []}
          />
        </div>
      </div>

      <ReminderDialog
        categoryOptions={categoryOptions}
        editingReminder={editingReminder}
        formState={formState}
        isCategoryLoading={categoriesQuery.isLoading}
        isOpen={isReminderDialogOpen}
        isSaving={isSaving}
        onCancel={() => resetForm(selectedAccount)}
        onChange={setFormState}
        onSubmit={handleFormSubmit}
      />
    </section>
  );
}
