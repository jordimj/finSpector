import { DEFAULT_PAYMENT_REMINDER_HORIZON_DAYS } from '@finance/shared';
import type { FastifyInstance } from 'fastify';
import { syncGoogleCalendarAfterReminderChange } from '../calendar-sync/autoSync.js';
import {
  detectPaymentReminderCandidates,
  toReminderCandidateKey,
} from '../payment-reminders/candidates.js';
import {
  generatePaymentReminderOccurrences,
  summarizeOccurrences,
} from '../payment-reminders/occurrences.js';
import { materializePaymentReminderOccurrences } from '../payment-reminders/materialize.js';
import {
  createPaymentReminder,
  deactivatePaymentReminder,
  dismissPaymentReminderSuggestion,
  getCandidateExpenseRows,
  getDismissedSuggestionKeys,
  getPaymentReminderById,
  getPaymentReminderRows,
  updatePaymentReminder,
  upsertOccurrenceStatus,
} from '../payment-reminders/repository.js';
import {
  toCandidateExpenseInput,
  toEditableBody,
  toOccurrenceOverrideResponse,
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

type PaymentReminderRouteRepository = {
  createPaymentReminder: typeof createPaymentReminder;
  deactivatePaymentReminder: typeof deactivatePaymentReminder;
  dismissPaymentReminderSuggestion: typeof dismissPaymentReminderSuggestion;
  getCandidateExpenseRows: typeof getCandidateExpenseRows;
  getDismissedSuggestionKeys: typeof getDismissedSuggestionKeys;
  getPaymentReminderById: typeof getPaymentReminderById;
  getPaymentReminderRows: typeof getPaymentReminderRows;
  updatePaymentReminder: typeof updatePaymentReminder;
  upsertOccurrenceStatus: typeof upsertOccurrenceStatus;
};

export type PaymentReminderRouteDependencies = {
  afterReminderChange?: () => Promise<void>;
  repository?: Partial<PaymentReminderRouteRepository>;
};

const defaultRepository: PaymentReminderRouteRepository = {
  createPaymentReminder,
  deactivatePaymentReminder,
  dismissPaymentReminderSuggestion,
  getCandidateExpenseRows,
  getDismissedSuggestionKeys,
  getPaymentReminderById,
  getPaymentReminderRows,
  updatePaymentReminder,
  upsertOccurrenceStatus,
};

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
  dependencies: PaymentReminderRouteDependencies = {},
): Promise<void> {
  const repository = {
    ...defaultRepository,
    ...dependencies.repository,
  };
  const afterReminderChange =
    dependencies.afterReminderChange ??
    (() =>
      syncGoogleCalendarAfterReminderChange({
        logger: app.log,
      }));

  app.get<{ Querystring: PaymentReminderQuery }>(
    '/',
    {
      schema: {
        querystring: paymentReminderQuerySchema({ includeDays: false }),
      },
    },
    async (request) => {
      const reminders = await repository.getPaymentReminderRows(
        request.query.account,
      );

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
      const { occurrences } = await materializePaymentReminderOccurrences({
        account: request.query.account,
        days: horizonDays,
      });

      return {
        summary: summarizeOccurrences(occurrences, horizonDays),
        occurrences,
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
        repository.getCandidateExpenseRows(request.query.account),
        repository.getPaymentReminderRows(request.query.account),
        repository.getDismissedSuggestionKeys(),
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
      const created = await repository.createPaymentReminder(reminder);
      await runAfterReminderChange(afterReminderChange, app);

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
      const existing = await repository.getPaymentReminderById(request.params.id);
      const patch = normalizePaymentReminderBody({
        ...toEditableBody(existing),
        ...request.body,
      });
      const updated = await repository.updatePaymentReminder(
        request.params.id,
        patch,
      );
      await runAfterReminderChange(afterReminderChange, app);

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
      await repository.getPaymentReminderById(request.params.id);
      await repository.deactivatePaymentReminder(request.params.id);
      await runAfterReminderChange(afterReminderChange, app);

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

      await repository.dismissPaymentReminderSuggestion(key);

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
      await repository.getPaymentReminderById(request.params.id);

      const occurrence = await repository.upsertOccurrenceStatus({
        dueDate: request.params.dueDate,
        matchedExpenseId: null,
        paymentReminderId: request.params.id,
        status: 'paid',
      });
      await runAfterReminderChange(afterReminderChange, app);

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
      await repository.getPaymentReminderById(request.params.id);

      const occurrence = await repository.upsertOccurrenceStatus({
        dueDate: request.params.dueDate,
        matchedExpenseId: null,
        paymentReminderId: request.params.id,
        status: 'skipped',
      });
      await runAfterReminderChange(afterReminderChange, app);

      return {
        occurrence: toOccurrenceOverrideResponse(occurrence),
      };
    },
  );
}

export async function runAfterReminderChange(
  afterReminderChange: () => Promise<void>,
  app: FastifyInstance,
): Promise<void> {
  try {
    await afterReminderChange();
  } catch (error) {
    app.log.warn(
      {
        err: error,
      },
      'Automatic Google Calendar sync failed after reminder change',
    );
  }
}
