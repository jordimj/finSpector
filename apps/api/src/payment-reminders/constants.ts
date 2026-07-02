import type { PaymentCadence } from '@finance/shared';

export const overdueLookbackDays = 45;
export const matchWindowDaysBefore = 5;
export const matchWindowDaysAfter = 7;
export const recurringCandidateMonths = 40;
export const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
export const uuidPattern =
  '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$';

export const cadenceMonthSteps = {
  annually: 12,
  monthly: 1,
  oneTime: 0,
  quarterly: 3,
} satisfies Record<PaymentCadence, number>;

export const candidateMinimumRows = {
  annually: 2,
  monthly: 3,
  oneTime: Number.POSITIVE_INFINITY,
  quarterly: 3,
} satisfies Record<PaymentCadence, number>;

export const candidateMinimumSpanMonths = {
  annually: 11,
  monthly: 2,
  oneTime: Number.POSITIVE_INFINITY,
  quarterly: 6,
} satisfies Record<PaymentCadence, number>;

export const candidateRecencyLimitDays = {
  annually: 425,
  monthly: 75,
  oneTime: 0,
  quarterly: 160,
} satisfies Record<PaymentCadence, number>;
