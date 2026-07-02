import {
  DEFAULT_EXPENSE_ACCOUNT,
  DEFAULT_PAYMENT_REMINDER_AMOUNT_TOLERANCE,
  DEFAULT_PAYMENT_REMINDER_CADENCE,
  DEFAULT_PAYMENT_REMINDER_LEAD_DAYS,
  type ExpenseAccount,
  type PaymentCadence,
  type PaymentReminder,
  type PaymentReminderCandidate,
} from '@finance/shared';
import type { PaymentReminderInput } from '../../hooks/paymentReminders/types';
import type { Category } from '../../hooks/useCategories';
import { formatDateKey } from '../../utils';

export type ReminderFormState = {
  account: ExpenseAccount;
  amount: string;
  amountTolerance: string;
  cadence: PaymentCadence;
  categoryValue: string;
  dueDay: string;
  leadDays: string;
  matchText: string;
  name: string;
  startDate: string;
};

export type CategoryOption = {
  categoryId: number;
  categoryName: string;
  label: string;
  subcategoryId: number | null;
  subcategoryName: string | null;
  value: string;
};

export const accountOptions: Array<{
  label: string;
  value: ExpenseAccount;
}> = [
  { label: 'Personal', value: 'mine' },
  { label: 'Shared', value: 'shared' },
  { label: 'Kids', value: 'kids' },
  { label: 'Splitwise', value: 'splitwise' },
];

export const cadenceOptions: Array<{
  label: string;
  value: PaymentCadence;
}> = [
  { label: 'One time', value: 'oneTime' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Annually', value: 'annually' },
];

export const defaultFormState: ReminderFormState = {
  account: DEFAULT_EXPENSE_ACCOUNT,
  amount: '',
  amountTolerance: DEFAULT_PAYMENT_REMINDER_AMOUNT_TOLERANCE.toFixed(2),
  cadence: DEFAULT_PAYMENT_REMINDER_CADENCE,
  categoryValue: '',
  dueDay: '1',
  leadDays: String(DEFAULT_PAYMENT_REMINDER_LEAD_DAYS),
  matchText: '',
  name: '',
  startDate: formatDateKey(new Date()),
};

export function createDefaultReminderFormState(
  account: ExpenseAccount | null,
): ReminderFormState {
  return {
    ...defaultFormState,
    account: account ?? DEFAULT_EXPENSE_ACCOUNT,
  };
}

export function createReminderFormStateFromReminder(
  reminder: PaymentReminder,
): ReminderFormState {
  return {
    account: reminder.account,
    amount: reminder.amount,
    amountTolerance: reminder.amountTolerance,
    cadence: reminder.cadence,
    categoryValue: toCategoryValue(reminder.categoryId, reminder.subcategoryId),
    dueDay: String(reminder.dueDay),
    leadDays: String(reminder.leadDays),
    matchText: reminder.matchText ?? '',
    name: reminder.name,
    startDate: reminder.startDate,
  };
}

export function toCandidatePaymentReminderInput(
  candidate: PaymentReminderCandidate,
): PaymentReminderInput {
  return {
    account: candidate.account,
    amount: candidate.amount,
    amountTolerance: candidate.amountTolerance,
    cadence: candidate.cadence,
    categoryId: candidate.categoryId,
    dueDay: candidate.dueDay,
    leadDays: DEFAULT_PAYMENT_REMINDER_LEAD_DAYS,
    matchText: candidate.matchText,
    name: candidate.name,
    source: 'detected',
    startDate: candidate.nextDueDate,
    subcategoryId: candidate.subcategoryId,
  };
}

export function buildCategoryOptions(categories: Category[]): CategoryOption[] {
  return categories.flatMap((category) => {
    const categoryOption = {
      categoryId: category.id,
      categoryName: category.name,
      label: category.name,
      subcategoryId: null,
      subcategoryName: null,
      value: toCategoryValue(category.id, null),
    };
    const subcategoryOptions = category.subcategories.map((subcategory) => ({
      categoryId: category.id,
      categoryName: category.name,
      label: `${category.name} / ${subcategory.name}`,
      subcategoryId: subcategory.id,
      subcategoryName: subcategory.name,
      value: toCategoryValue(category.id, subcategory.id),
    }));

    return [categoryOption, ...subcategoryOptions];
  });
}

export function toPaymentReminderInput(
  formState: ReminderFormState,
  categoryOptions: CategoryOption[],
): PaymentReminderInput | null {
  const category =
    categoryOptions.find(
      (option) => option.value === formState.categoryValue,
    ) ?? categoryOptions[0];
  const amount = Number(formState.amount);
  const amountTolerance =
    formState.cadence === 'oneTime'
      ? 0
      : Number(formState.amountTolerance);
  const dueDay =
    formState.cadence === 'oneTime'
      ? getDayFromDateKey(formState.startDate)
      : Number(formState.dueDay);
  const leadDays = Number(formState.leadDays);

  if (
    category === undefined ||
    formState.name.trim().length === 0 ||
    dueDay === null ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isFinite(amountTolerance) ||
    amountTolerance < 0 ||
    !Number.isInteger(dueDay) ||
    dueDay < 1 ||
    dueDay > 31 ||
    !Number.isInteger(leadDays) ||
    leadDays < 0 ||
    leadDays > 30
  ) {
    return null;
  }

  return {
    account: formState.account,
    amount: amount.toFixed(2),
    amountTolerance: amountTolerance.toFixed(2),
    cadence: formState.cadence,
    categoryId: category.categoryId,
    dueDay,
    leadDays,
    matchText:
      formState.matchText.trim().length === 0
        ? null
        : formState.matchText.trim(),
    name: formState.name.trim(),
    source: 'manual',
    startDate: formState.startDate,
    subcategoryId: category.subcategoryId,
  };
}

export function toCategoryValue(
  categoryId: number,
  subcategoryId: number | null,
) {
  return `${categoryId}:${subcategoryId === null ? 'none' : subcategoryId}`;
}

function getDayFromDateKey(date: string): number | null {
  const day = Number(date.slice(8, 10));

  return Number.isInteger(day) && day >= 1 && day <= 31 ? day : null;
}
