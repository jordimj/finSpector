import type { FastifyInstance } from 'fastify';
import { getGoogleCalendarConfig } from '../calendar-sync/config.js';
import { createGoogleCalendarClient } from '../calendar-sync/googleClient.js';
import {
  buildGoogleCalendarStatus,
  completeGoogleCalendarConnection,
  createGoogleCalendarConnectUrl,
  defaultCalendarSyncRepository,
  deleteGoogleCalendarEvents,
  disconnectGoogleCalendar,
  syncGoogleCalendar,
  type CalendarSyncRepository,
} from '../calendar-sync/service.js';
import {
  createDefaultSecretStore,
  type SecretStore,
} from '../calendar-sync/secretStore.js';
import type {
  GoogleCalendarClient,
  GoogleCalendarConfig,
} from '../calendar-sync/types.js';

type CallbackQuery = {
  code?: string;
  error?: string;
  state?: string;
};

export type GoogleCalendarSyncRouteDependencies = {
  client?: GoogleCalendarClient;
  config?: GoogleCalendarConfig | null;
  repository?: CalendarSyncRepository;
  secretStore?: SecretStore;
};

export async function registerGoogleCalendarSyncRoutes(
  app: FastifyInstance,
  dependencies: GoogleCalendarSyncRouteDependencies = {},
): Promise<void> {
  app.get('/status', async () => {
    const { config, secretStore } = resolveRouteDependencies(dependencies);

    return buildGoogleCalendarStatus({ config, secretStore });
  });

  app.post('/connect', async (_request, reply) => {
    const { client, config, secretStore } =
      resolveRouteDependencies(dependencies);

    if (config === null || client === null || !(await secretStore.isAvailable())) {
      return reply.status(400).send({
        error: 'Calendar sync not configured',
      });
    }

    return {
      authorizationUrl: await createGoogleCalendarConnectUrl({ client }),
    };
  });

  app.get<{ Querystring: CallbackQuery }>(
    '/callback',
    {
      schema: {
        querystring: {
          type: 'object',
          additionalProperties: true,
          properties: {
            code: { type: 'string' },
            error: { type: 'string' },
            state: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { client, config, secretStore } =
        resolveRouteDependencies(dependencies);

      if (request.query.error !== undefined) {
        throw Object.assign(new Error('Google Calendar authorization failed'), {
          statusCode: 400,
        });
      }

      if (
        config === null ||
        client === null ||
        request.query.code === undefined ||
        request.query.state === undefined
      ) {
        throw Object.assign(new Error('Invalid Google Calendar callback'), {
          statusCode: 400,
        });
      }

      const { redirectPath } = await completeGoogleCalendarConnection({
        client,
        code: request.query.code,
        secretStore,
        state: request.query.state,
      });

      return reply.redirect(`${redirectPath}?calendarSync=connected`);
    },
  );

  app.post('/disconnect', async (_request, reply) => {
    const { client, config, secretStore } =
      resolveRouteDependencies(dependencies);

    if (config === null || client === null) {
      return reply.status(400).send({
        error: 'Calendar sync not configured',
      });
    }

    await disconnectGoogleCalendar({ client, secretStore });

    return {
      state: 'notConnected',
    };
  });

  app.delete('/events', async (_request, reply) => {
    const { client, config, repository, secretStore } =
      resolveRouteDependencies(dependencies);

    if (config === null || client === null || !(await secretStore.isAvailable())) {
      return reply.status(400).send({
        error: 'Calendar sync not configured',
      });
    }

    return {
      result: await deleteGoogleCalendarEvents({
        client,
        repository,
        secretStore,
      }),
    };
  });

  app.post('/sync', async (_request, reply) => {
    const { client, config, secretStore } =
      resolveRouteDependencies(dependencies);

    if (config === null || client === null || !(await secretStore.isAvailable())) {
      return reply.status(400).send({
        error: 'Calendar sync not configured',
      });
    }

    return {
      result: await syncGoogleCalendar({ client, secretStore }),
    };
  });
}

function resolveRouteDependencies(
  dependencies: GoogleCalendarSyncRouteDependencies,
): {
  client: GoogleCalendarClient | null;
  config: GoogleCalendarConfig | null;
  repository: CalendarSyncRepository;
  secretStore: SecretStore;
} {
  const config =
    dependencies.config === undefined
      ? getGoogleCalendarConfig()
      : dependencies.config;
  const client =
    dependencies.client ??
    (config === null ? null : createGoogleCalendarClient(config));

  return {
    client,
    config,
    repository: dependencies.repository ?? defaultCalendarSyncRepository,
    secretStore: dependencies.secretStore ?? createDefaultSecretStore(),
  };
}
