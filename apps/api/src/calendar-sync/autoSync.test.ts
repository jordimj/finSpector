import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { InMemorySecretStore, type SecretStore } from './secretStore.js';
import { syncGoogleCalendarAfterReminderChange } from './autoSync.js';
import type {
  CalendarIntegrationRow,
  GoogleCalendarClient,
} from './types.js';

describe('syncGoogleCalendarAfterReminderChange', () => {
  it('skips quietly when calendar sync cannot run', async () => {
    let syncCalls = 0;

    await syncGoogleCalendarAfterReminderChange({
      config: null,
      sync: async () => {
        syncCalls += 1;

        return syncResult();
      },
    });
    await syncGoogleCalendarAfterReminderChange({
      client: googleClient(),
      config: calendarConfig(),
      secretStore: unavailableSecretStore(),
      sync: async () => {
        syncCalls += 1;

        return syncResult();
      },
    });
    await syncGoogleCalendarAfterReminderChange({
      client: googleClient(),
      config: calendarConfig(),
      getIntegration: async () => null,
      secretStore: new InMemorySecretStore(),
      sync: async () => {
        syncCalls += 1;

        return syncResult();
      },
    });
    await syncGoogleCalendarAfterReminderChange({
      client: googleClient(),
      config: calendarConfig(),
      getIntegration: async () =>
        integrationRow({
          status: 'disconnected',
        }),
      secretStore: new InMemorySecretStore(),
      sync: async () => {
        syncCalls += 1;

        return syncResult();
      },
    });

    assert.equal(syncCalls, 0);
  });

  it('runs sync for connected integrations and swallows failures', async () => {
    const secretStore = new InMemorySecretStore();
    let syncCalls = 0;
    let warningCount = 0;

    await syncGoogleCalendarAfterReminderChange({
      client: googleClient(),
      config: calendarConfig(),
      getIntegration: async () => integrationRow(),
      logger: {
        warn() {
          warningCount += 1;
        },
      },
      secretStore,
      sync: async ({ integration }) => {
        syncCalls += 1;
        assert.equal(integration.id, 'integration-1');

        throw new Error('Calendar is tired');
      },
    });

    assert.equal(syncCalls, 1);
    assert.equal(warningCount, 1);
  });
});

function calendarConfig() {
  return {
    clientId: 'client-id',
    clientSecret: 'client-secret',
    redirectUri: 'http://localhost/callback',
  };
}

function googleClient(): GoogleCalendarClient {
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
  };
}

function integrationRow(
  overrides: Partial<CalendarIntegrationRow> = {},
): CalendarIntegrationRow {
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
    ...overrides,
  };
}

function syncResult() {
  return {
    deleted: 0,
    inserted: 0,
    skipped: 0,
    updated: 0,
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
