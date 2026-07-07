import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GoogleCalendarApiError } from './googleClient.js';
import { InMemorySecretStore } from './secretStore.js';
import {
  deleteGoogleCalendarEvents,
  resolveGoogleCalendarForConnection,
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

  it('also deletes events from visible duplicate FinHunter calendars', async () => {
    const secretStore = new InMemorySecretStore();
    await secretStore.set('token-ref', 'refresh-token');

    const deletedInputs: GoogleCalendarEventDeleteInput[] = [];
    const listedInputs: GoogleCalendarEventListInput[] = [];
    const client = googleClient({
      async deleteEvent(input) {
        deletedInputs.push(input);
      },
      async listCalendars() {
        return [
          {
            id: 'old-calendar',
            summary: 'FinHunter Reminders',
          },
          {
            id: 'family-calendar',
            summary: 'Family',
          },
        ];
      },
      async listEvents(input) {
        listedInputs.push(input);

        return {
          events:
            input.calendarId === 'new-calendar'
              ? [{ id: 'new-event' }]
              : [{ id: 'old-event' }],
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
          calendar_id: 'new-calendar',
          id: 'integration-1',
          token_ref: 'token-ref',
        });
      },
      async markActiveCalendarEventSyncsDeleted() {
        return 2;
      },
    };

    const result = await deleteGoogleCalendarEvents({
      client,
      repository,
      secretStore,
    });

    assert.equal(result.deleted, 2);
    assert.deepEqual(
      listedInputs.map((input) => input.calendarId),
      ['new-calendar', 'old-calendar'],
    );
    assert.deepEqual(
      deletedInputs.map((input) => ({
        calendarId: input.calendarId,
        eventId: input.eventId,
      })),
      [
        { calendarId: 'new-calendar', eventId: 'new-event' },
        { calendarId: 'old-calendar', eventId: 'old-event' },
      ],
    );
  });

  it('skips an inaccessible stored calendar while deleting visible duplicates', async () => {
    const secretStore = new InMemorySecretStore();
    await secretStore.set('token-ref', 'refresh-token');

    const deletedInputs: GoogleCalendarEventDeleteInput[] = [];
    const client = googleClient({
      async deleteEvent(input) {
        deletedInputs.push(input);
      },
      async listCalendars() {
        return [
          {
            id: 'old-calendar',
            summary: 'FinHunter Reminders',
          },
        ];
      },
      async listEvents(input) {
        if (input.calendarId === 'missing-calendar') {
          throw new GoogleCalendarApiError('Missing calendar', 404);
        }

        return {
          events: [{ id: 'old-event' }],
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
          calendar_id: 'missing-calendar',
          id: 'integration-1',
          token_ref: 'token-ref',
        });
      },
      async markActiveCalendarEventSyncsDeleted() {
        return 1;
      },
    };

    const result = await deleteGoogleCalendarEvents({
      client,
      repository,
      secretStore,
    });

    assert.equal(result.deleted, 1);
    assert.deepEqual(
      deletedInputs.map((input) => ({
        calendarId: input.calendarId,
        eventId: input.eventId,
      })),
      [{ calendarId: 'old-calendar', eventId: 'old-event' }],
    );
  });
});

describe('resolveGoogleCalendarForConnection', () => {
  it('reuses the stored calendar id when it is still accessible', async () => {
    let didCreateCalendar = false;
    const listedCalendars: string[] = [];
    const client = googleClient({
      async createCalendar() {
        didCreateCalendar = true;

        return {
          id: 'created-calendar',
          summary: 'FinHunter Reminders',
        };
      },
      async listCalendars() {
        listedCalendars.push('calendar-list');

        return [];
      },
      async listEvents(input) {
        assert.equal(input.calendarId, 'old-calendar');

        return {
          events: [],
          nextPageToken: null,
        };
      },
    });

    const calendar = await resolveGoogleCalendarForConnection({
      accessToken: 'access-token',
      client,
      preferredCalendar: {
        id: 'old-calendar',
        summary: 'FinHunter Reminders',
      },
    });

    assert.deepEqual(calendar, {
      id: 'old-calendar',
      summary: 'FinHunter Reminders',
    });
    assert.equal(didCreateCalendar, false);
    assert.deepEqual(listedCalendars, []);
  });

  it('falls back to a visible FinHunter calendar when the stored id is inaccessible', async () => {
    let didCreateCalendar = false;
    const client = googleClient({
      async createCalendar() {
        didCreateCalendar = true;

        return {
          id: 'created-calendar',
          summary: 'FinHunter Reminders',
        };
      },
      async listCalendars() {
        return [
          {
            id: 'visible-calendar',
            summary: 'FinHunter Reminders',
          },
        ];
      },
      async listEvents() {
        throw new GoogleCalendarApiError('Missing calendar', 404);
      },
    });

    const calendar = await resolveGoogleCalendarForConnection({
      accessToken: 'access-token',
      client,
      preferredCalendar: {
        id: 'missing-calendar',
        summary: 'FinHunter Reminders',
      },
    });

    assert.deepEqual(calendar, {
      id: 'visible-calendar',
      summary: 'FinHunter Reminders',
    });
    assert.equal(didCreateCalendar, false);
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
