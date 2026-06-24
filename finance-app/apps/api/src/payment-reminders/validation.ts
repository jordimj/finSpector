import {
  DEFAULT_PAYMENT_REMINDER_AMOUNT_TOLERANCE,
  DEFAULT_PAYMENT_REMINDER_CADENCE,
  DEFAULT_PAYMENT_REMINDER_HORIZON_DAYS,
  DEFAULT_PAYMENT_REMINDER_LEAD_DAYS,
  EXPENSE_ACCOUNTS,
  PAYMENT_CADENCES,
} from '@finance/shared';
import {
  isoDatePattern,
  uuidPattern,
} from './constants.js';
import { toMoneyText, toPositiveMoneyText } from './money.js';
import type {
  NormalizedPaymentReminderBody,
  PaymentReminderBody,
} from './types.js';

export function paymentReminderQuerySchema(options: {
  includeDays: boolean;
}): object {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      account: { type: 'string', enum: EXPENSE_ACCOUNTS },
      ...(options.includeDays
        ? {
            days: {
              type: 'integer',
              minimum: 1,
              maximum: 365,
              default: DEFAULT_PAYMENT_REMINDER_HORIZON_DAYS,
            },
          }
        : {}),
    },
  };
}

export function paymentReminderBodySchema(options: {
  requireCoreFields: boolean;
}): object {
  return {
    type: 'object',
    additionalProperties: false,
    ...(options.requireCoreFields
      ? {
          required: [
            'name',
            'amount',
            'account',
            'categoryId',
            'startDate',
          ],
        }
      : {}),
    properties: {
      account: { type: 'string', enum: EXPENSE_ACCOUNTS },
      amount: moneySchema(),
      amountTolerance: moneySchema(),
      cadence: { type: 'string', enum: PAYMENT_CADENCES },
      categoryId: { type: 'integer', minimum: 1 },
      dueDay: { type: 'integer', minimum: 1, maximum: 31 },
      leadDays: { type: 'integer', minimum: 0, maximum: 30 },
      matchText: {
        anyOf: [{ type: 'string' }, { type: 'null' }],
      },
      name: { type: 'string', minLength: 1, maxLength: 120 },
      source: { type: 'string', enum: ['manual', 'detected'] },
      startDate: { type: 'string', pattern: isoDatePattern.source },
      subcategoryId: {
        anyOf: [{ type: 'integer', minimum: 1 }, { type: 'null' }],
      },
    },
  };
}

export function idParamsSchema(): object {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: {
      id: { type: 'string', pattern: uuidPattern },
    },
  };
}

export function occurrenceParamsSchema(): object {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'dueDate'],
    properties: {
      dueDate: { type: 'string', pattern: isoDatePattern.source },
      id: { type: 'string', pattern: uuidPattern },
    },
  };
}

export function normalizePaymentReminderBody(
  body: PaymentReminderBody,
): NormalizedPaymentReminderBody {
  const name = body.name?.trim() ?? '';
  const amount = toPositiveMoneyText(body.amount);
  const cadence = body.cadence ?? DEFAULT_PAYMENT_REMINDER_CADENCE;
  const amountTolerance =
    cadence === 'oneTime'
      ? '0.00'
      : body.amountTolerance === undefined
        ? toMoneyText(DEFAULT_PAYMENT_REMINDER_AMOUNT_TOLERANCE)
        : toPositiveMoneyText(body.amountTolerance, { allowZero: true });
  const leadDays = body.leadDays ?? DEFAULT_PAYMENT_REMINDER_LEAD_DAYS;
  const startDate = body.startDate ?? '';
  const startDateDay = isoDatePattern.test(startDate)
    ? Number(startDate.slice(8, 10))
    : 1;
  const dueDay = cadence === 'oneTime' ? startDateDay : body.dueDay ?? 1;

  if (
    name.length === 0 ||
    amount === null ||
    amountTolerance === null ||
    body.account === undefined ||
    body.categoryId === undefined ||
    !isoDatePattern.test(startDate) ||
    dueDay < 1 ||
    dueDay > 31 ||
    leadDays < 0 ||
    leadDays > 30
  ) {
    throw Object.assign(new Error('Invalid payment reminder'), {
      statusCode: 400,
    });
  }

  return {
    account: body.account,
    amount,
    amountTolerance,
    cadence,
    categoryId: body.categoryId,
    dueDay,
    leadDays,
    matchText: normalizeNullableText(body.matchText),
    name,
    source: body.source ?? 'manual',
    startDate,
    subcategoryId: body.subcategoryId ?? null,
  };
}

function moneySchema(): object {
  return {
    anyOf: [
      { type: 'number', exclusiveMinimum: 0 },
      { type: 'string', minLength: 1 },
    ],
  };
}

function normalizeNullableText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length === 0 ? null : trimmed;
}
