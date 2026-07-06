import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GoogleCalendarApiError } from './googleClient.js';
import { InMemorySecretStore } from './secretStore.js';
import {
  deleteGoogleCalendarEvents,
  type CalendarSyncRepository,
} from './service.js';
import type {
  CalendarIntegrationRow,
  GoogleCalendarClient,
  GoogleCalendarEventDeleteInput,
  GoogleCalendarEventListInput,
} from './types.js';

describe('deleteGoogleCalendarEvents', () => {
  it('deletes every listed event from the stored calendar and marks sync rows deleted', async () => {
    const secretStore = new InMemorySecretStore();
    await secretStore.set('token-ref', 'refresh-token');

    const listedInputs: GoogleCalendarEventListInput[] = [];
    const deletedInputs: GoogleCalendarEventDeleteInput[] = [];
    let markedIntegrationId: string | null = null;
    const client = googleClient({
      async deleteEvent(input) {
        deletedInputs.push(input);

        if (input.eventId === 'already-gone') {
          throw new GoogleCalendarApiError('Missing event', 404);
        }
      },
      async listEvents(input) {
        listedInputs.push(input);

        if (input.pageToken === null) {
          return {
            events: [{ id: 'event-1' }, { id: 'already-gone' }],
            nextPageToken: 'next-page',
          };
        }

        return {
          events: [{ id: 'event-2' }],
          nextPageToken: null,
        };
      },
      async refreshAccessToken(refreshToken) {
        assert.equal(refreshToken, 'refresh-token');

        return {
          accessToken: 'access-token',
          expiresIn: 3600,
          refreshToken: null,
          scope: null,
        };
      },
    });
    const repository: CalendarSyncRepository = {
      async getGoogleIntegration() {
        return integrationRow({
          calendar_id: 'calendar-1',
          id: 'integration-1',
          token_ref: 'token-ref',
        });
      },
      async markActiveCalendarEventSyncsDeleted(integrationId) {
        markedIntegrationId = integrationId;

        return 3;
      },
    };

    const result = await deleteGoogleCalendarEvents({
      client,
      repository,
      secretStore,
    });

    assert.equal(result.deleted, 2);
    assert.deepEqual(
      listedInputs.map((input) => ({
        calendarId: input.calendarId,
        pageToken: input.pageToken,
      })),
      [
        { calendarId: 'calendar-1', pageToken: null },
        { calendarId: 'calendar-1', pageToken: 'next-page' },
      ],
    );
    assert.deepEqual(
      deletedInputs.map((input) => ({
        calendarId: input.calendarId,
        eventId: input.eventId,
      })),
      [
        { calendarId: 'calendar-1', eventId: 'event-1' },
        { calendarId: 'calendar-1', eventId: 'already-gone' },
        { calendarId: 'calendar-1', eventId: 'event-2' },
      ],
    );
    assert.equal(markedIntegrationId, 'integration-1');
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

function tokenResponse() {
  return {
    accessToken: 'access-token',
    expiresIn: 3600,
    refreshToken: null,
    scope: null,
  };
}
