import {
  DEFAULT_PAYMENT_REMINDER_HORIZON_DAYS,
  type PaymentReminderOccurrence,
} from '@finance/shared';
import type { FastifyInstance } from 'fastify';
import {
  detectPaymentReminderCandidates,
  toReminderCandidateKey,
} from '../payment-reminders/candidates.js';
import { overdueLookbackDays } from '../payment-reminders/constants.js';
import { addDays, formatDateKey } from '../payment-reminders/date.js';
import {
  compareOccurrences,
  generatePaymentReminderOccurrences,
  occurrenceKey,
  summarizeOccurrences,
} from '../payment-reminders/occurrences.js';
import {
  createPaymentReminder,
  deactivatePaymentReminder,
  dismissPaymentReminderSuggestion,
  findMatchingExpense,
  getCandidateExpenseRows,
  getDismissedSuggestionKeys,
  getOccurrenceOverrides,
  getPaymentReminderById,
  getPaymentReminderRows,
  updatePaymentReminder,
  upsertOccurrenceStatus,
} from '../payment-reminders/repository.js';
import {
  toCandidateExpenseInput,
  toEditableBody,
  toOccurrenceOverrideResponse,
  toOccurrenceReminder,
  toOccurrenceResponse,
  toPaymentReminderResponse,
} from '../payment-reminders/serializers.js';
import type {
  DismissCandidateBody,
  OccurrenceParams,
  PaymentReminderBody,
  PaymentReminderParams,
  PaymentReminderQuery,
} from '../payment-reminders/types.js';
import {
  idParamsSchema,
  normalizePaymentReminderBody,
  occurrenceParamsSchema,
  paymentReminderBodySchema,
  paymentReminderQuerySchema,
} from '../payment-reminders/validation.js';

export type {
  CandidateExpenseInput,
  PaymentReminderForOccurrence,
} from '../payment-reminders/types.js';
export {
  detectPaymentReminderCandidates,
  normalizePaymentMatchText,
  toReminderCandidateKey,
} from '../payment-reminders/candidates.js';
export {
  generatePaymentReminderOccurrences,
  getOpenPaymentOccurrenceState,
  isPaymentReminderExpenseMatch,
} from '../payment-reminders/occurrences.js';

export async function registerPaymentReminderRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get<{ Querystring: PaymentReminderQuery }>(
    '/',
    {
      schema: {
        querystring: paymentReminderQuerySchema({ includeDays: false }),
      },
    },
    async (request) => {
      const reminders = await getPaymentReminderRows(request.query.account);

      return {
        reminders: reminders.map(toPaymentReminderResponse),
      };
    },
  );

  app.get<{ Querystring: PaymentReminderQuery }>(
    '/upcoming',
    {
      schema: {
        querystring: paymentReminderQuerySchema({ includeDays: true }),
      },
    },
    async (request) => {
      const horizonDays =
        request.query.days ?? DEFAULT_PAYMENT_REMINDER_HORIZON_DAYS;
      const today = formatDateKey(new Date());
      const startDate = addDays(today, -overdueLookbackDays);
      const endDate = addDays(today, horizonDays);
      const reminders = await getPaymentReminderRows(request.query.account);
      const generated = reminders.flatMap((reminder) =>
        generatePaymentReminderOccurrences(
          toOccurrenceReminder(reminder),
          startDate,
          endDate,
          today,
        ),
      );
      const overrides = await getOccurrenceOverrides(
        reminders.map((reminder) => reminder.id),
        startDate,
        endDate,
      );
      const occurrences: PaymentReminderOccurrence[] = [];

      for (const occurrence of generated) {
        const override = overrides.get(occurrenceKey(occurrence));

        if (override !== undefined) {
          occurrences.push(toOccurrenceResponse(occurrence, override));
          continue;
        }

        const matchedExpense = await findMatchingExpense(occurrence);

        if (matchedExpense === undefined) {
          occurrences.push(toOccurrenceResponse(occurrence));
          continue;
        }

        const paidOverride = await upsertOccurrenceStatus({
          dueDate: occurrence.dueDate,
          matchedExpenseId: matchedExpense.id,
          paymentReminderId: occurrence.reminderId,
          status: 'paid',
        });

        occurrences.push(toOccurrenceResponse(occurrence, paidOverride));
      }

      return {
        summary: summarizeOccurrences(occurrences, horizonDays),
        occurrences: occurrences.sort(compareOccurrences),
      };
    },
  );

  app.get<{ Querystring: PaymentReminderQuery }>(
    '/candidates',
    {
      schema: {
        querystring: paymentReminderQuerySchema({ includeDays: false }),
      },
    },
    async (request) => {
      const [candidateRows, reminders, dismissedKeys] = await Promise.all([
        getCandidateExpenseRows(request.query.account),
        getPaymentReminderRows(request.query.account),
        getDismissedSuggestionKeys(),
      ]);
      const existingKeys = new Set(
        reminders.flatMap((reminder) =>
          reminder.match_text === null
            ? []
            : [
                toReminderCandidateKey({
                  account: reminder.account,
                  cadence: reminder.cadence,
                  categoryId: reminder.category_id,
                  matchText: reminder.match_text,
                  subcategoryId: reminder.subcategory_id,
                }),
              ],
        ),
      );

      return {
        candidates: detectPaymentReminderCandidates(
          candidateRows.map(toCandidateExpenseInput),
          existingKeys,
          dismissedKeys,
        ),
      };
    },
  );

  app.post<{ Body: PaymentReminderBody }>(
    '/',
    {
      schema: {
        body: paymentReminderBodySchema({ requireCoreFields: true }),
      },
    },
    async (request, reply) => {
      const reminder = normalizePaymentReminderBody(request.body);
      const created = await createPaymentReminder(reminder);

      return reply.status(201).send({
        reminder: toPaymentReminderResponse(created),
      });
    },
  );

  app.patch<{ Body: PaymentReminderBody; Params: PaymentReminderParams }>(
    '/:id',
    {
      schema: {
        body: paymentReminderBodySchema({ requireCoreFields: false }),
        params: idParamsSchema(),
      },
    },
    async (request) => {
      const existing = await getPaymentReminderById(request.params.id);
      const patch = normalizePaymentReminderBody({
        ...toEditableBody(existing),
        ...request.body,
      });
      const updated = await updatePaymentReminder(request.params.id, patch);

      return {
        reminder: toPaymentReminderResponse(updated),
      };
    },
  );

  app.delete<{ Params: PaymentReminderParams }>(
    '/:id',
    {
      schema: {
        params: idParamsSchema(),
      },
    },
    async (request) => {
      await getPaymentReminderById(request.params.id);
      await deactivatePaymentReminder(request.params.id);

      return {
        id: request.params.id,
        active: false,
      };
    },
  );

  app.post<{ Body: DismissCandidateBody }>(
    '/candidates/dismiss',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['key'],
          properties: {
            key: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (request) => {
      const key = request.body.key ?? '';

      await dismissPaymentReminderSuggestion(key);

      return {
        key,
      };
    },
  );

  app.post<{ Params: OccurrenceParams }>(
    '/:id/occurrences/:dueDate/mark-paid',
    {
      schema: {
        params: occurrenceParamsSchema(),
      },
    },
    async (request) => {
      await getPaymentReminderById(request.params.id);

      const occurrence = await upsertOccurrenceStatus({
        dueDate: request.params.dueDate,
        matchedExpenseId: null,
        paymentReminderId: request.params.id,
        status: 'paid',
      });

      return {
        occurrence: toOccurrenceOverrideResponse(occurrence),
      };
    },
  );

  app.post<{ Params: OccurrenceParams }>(
    '/:id/occurrences/:dueDate/skip',
    {
      schema: {
        params: occurrenceParamsSchema(),
      },
    },
    async (request) => {
      await getPaymentReminderById(request.params.id);

      const occurrence = await upsertOccurrenceStatus({
        dueDate: request.params.dueDate,
        matchedExpenseId: null,
        paymentReminderId: request.params.id,
        status: 'skipped',
      });

      return {
        occurrence: toOccurrenceOverrideResponse(occurrence),
      };
    },
  );
}
