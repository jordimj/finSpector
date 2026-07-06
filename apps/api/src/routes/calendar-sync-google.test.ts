import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import Fastify from 'fastify';
import {
  InMemorySecretStore,
  type SecretStore,
} from '../calendar-sync/secretStore.js';
import type { CalendarSyncRepository } from '../calendar-sync/service.js';
import { registerGoogleCalendarSyncRoutes } from './calendar-sync-google.js';
import type {
  CalendarIntegrationRow,
  GoogleCalendarClient,
} from '../calendar-sync/types.js';

describe('registerGoogleCalendarSyncRoutes', () => {
  it('reports not configured without touching storage', async () => {
    const app = Fastify({ logger: false });

    await app.register(registerGoogleCalendarSyncRoutes, {
      config: null,
      secretStore: new InMemorySecretStore(),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/status',
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json<{ state: string }>().state, 'notConfigured');

    await app.close();
  });

  it('rejects malformed callbacks', async () => {
    const app = Fastify({ logger: false });

    await app.register(registerGoogleCalendarSyncRoutes, {
      config: null,
      secretStore: new InMemorySecretStore(),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/callback',
    });

    assert.equal(response.statusCode, 400);

    await app.close();
  });

  it('rejects delete-all events when calendar sync is not configured', async () => {
    const app = Fastify({ logger: false });

    await app.register(registerGoogleCalendarSyncRoutes, {
      config: null,
      secretStore: new InMemorySecretStore(),
    });

    const response = await app.inject({
      method: 'DELETE',
      url: '/events',
    });

    assert.equal(response.statusCode, 400);

    await app.close();
  });

  it('rejects delete-all events when secret storage is unavailable', async () => {
    const app = Fastify({ logger: false });

    await app.register(registerGoogleCalendarSyncRoutes, {
      config: {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost/callback',
      },
      secretStore: unavailableSecretStore(),
    });

    const response = await app.inject({
      method: 'DELETE',
      url: '/events',
    });

    assert.equal(response.statusCode, 400);

    await app.close();
  });

  it('deletes calendar events through the route when configured', async () => {
    const app = Fastify({ logger: false });
    const secretStore = new InMemorySecretStore();
    await secretStore.set('token-ref', 'refresh-token');
    let listedCalendarId: string | null = null;
    let markedIntegrationId: string | null = null;
    const repository: CalendarSyncRepository = {
      async getGoogleIntegration() {
        return integrationRow();
      },
      async markActiveCalendarEventSyncsDeleted(integrationId) {
        markedIntegrationId = integrationId;

        return 1;
      },
    };

    await app.register(registerGoogleCalendarSyncRoutes, {
      client: googleClient({
        async deleteEvent() {},
        async listEvents(input) {
          listedCalendarId = input.calendarId;

          return {
            events: [{ id: 'event-1' }],
            nextPageToken: null,
          };
        },
        async refreshAccessToken() {
          return {
            accessToken: 'access-token',
            expiresIn: 3600,
            refreshToken: null,
            scope: null,
          };
        },
      }),
      config: {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost/callback',
      },
      repository,
      secretStore,
    });

    const response = await app.inject({
      method: 'DELETE',
      url: '/events',
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), {
      result: {
        deleted: 1,
      },
    });
    assert.equal(listedCalendarId, 'calendar-1');
    assert.equal(markedIntegrationId, 'integration-1');

    await app.close();
  });
});

function googleClient(
  overrides: Partial<GoogleCalendarClient>,
): GoogleCalendarClient {
  return {
    buildAuthorizationUrl() {
      return 'https://accounts.google.test';
    },
    async createCalendar() {
      return {
        id: 'calendar-1',
        summary: 'FinHunter Reminders',
      };
    },
    async deleteEvent() {},
    async exchangeCodeForTokens() {
      return tokenResponse();
    },
    async insertEvent() {},
    async listCalendars() {
      return [];
    },
    async listEvents() {
      return {
        events: [],
        nextPageToken: null,
      };
    },
    async refreshAccessToken() {
      return tokenResponse();
    },
    async revokeToken() {},
    async updateEvent() {},
    ...overrides,
  };
}

function integrationRow(): CalendarIntegrationRow {
  return {
    account_email: null,
    calendar_id: 'calendar-1',
    calendar_name: 'FinHunter Reminders',
    created_at: '2026-07-01T00:00:00.000Z',
    id: 'integration-1',
    last_error: null,
    last_synced_at: null,
    provider: 'google',
    provider_account_id: null,
    scopes: [],
    status: 'connected',
    token_ref: 'token-ref',
    updated_at: '2026-07-01T00:00:00.000Z',
  };
}

function unavailableSecretStore(): SecretStore {
  return {
    async delete() {},
    async get() {
      return null;
    },
    async isAvailable() {
      return false;
    },
    async set() {},
  };
}

function tokenResponse() {
  return {
    accessToken: 'access-token',
    expiresIn: 3600,
    refreshToken: null,
    scope: null,
  };
}
