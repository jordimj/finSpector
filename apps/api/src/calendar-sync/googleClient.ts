import {
  GOOGLE_CALENDAR_SCOPE,
  type GoogleCalendarClient,
  type GoogleCalendarConfig,
  type GoogleCalendarEvent,
  type GoogleCalendarEventDeleteInput,
  type GoogleCalendarEventWriteInput,
  type GoogleCalendarSummary,
  type GoogleTokenResponse,
} from './types.js';

const authBaseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
const tokenUrl = 'https://oauth2.googleapis.com/token';
const revokeUrl = 'https://oauth2.googleapis.com/revoke';
const calendarApiBaseUrl = 'https://www.googleapis.com/calendar/v3';

export class GoogleCalendarApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'GoogleCalendarApiError';
  }
}

export function createGoogleCalendarClient(
  config: GoogleCalendarConfig,
): GoogleCalendarClient {
  return {
    buildAuthorizationUrl({ codeChallenge, state }) {
      const params = new URLSearchParams({
        access_type: 'offline',
        client_id: config.clientId,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        prompt: 'consent',
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: GOOGLE_CALENDAR_SCOPE,
        state,
      });

      return `${authBaseUrl}?${params.toString()}`;
    },

    async createCalendar(accessToken, summary) {
      return requestJson<GoogleCalendarSummary>(
        `${calendarApiBaseUrl}/calendars`,
        {
          accessToken,
          body: {
            summary,
            timeZone: 'Europe/Zurich',
          },
          method: 'POST',
          parse: parseCalendarSummary,
        },
      );
    },

    async deleteEvent(input) {
      await requestEmpty(
        `${calendarApiBaseUrl}/calendars/${encodeURIComponent(
          input.calendarId,
        )}/events/${encodeURIComponent(input.eventId)}`,
        {
          accessToken: input.accessToken,
          method: 'DELETE',
        },
      );
    },

    async exchangeCodeForTokens({ code, codeVerifier }) {
      return requestToken(
        new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          code_verifier: codeVerifier,
          grant_type: 'authorization_code',
          redirect_uri: config.redirectUri,
        }),
      );
    },

    async insertEvent(input) {
      await writeEvent('POST', input);
    },

    async listCalendars(accessToken) {
      const response = await requestJson<{ items: GoogleCalendarSummary[] }>(
        `${calendarApiBaseUrl}/users/me/calendarList?minAccessRole=owner`,
        {
          accessToken,
          method: 'GET',
          parse: parseCalendarList,
        },
      );

      return response.items;
    },

    async refreshAccessToken(refreshToken) {
      return requestToken(
        new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      );
    },

    async revokeToken(token) {
      const response = await fetch(revokeUrl, {
        body: new URLSearchParams({ token }),
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
      });

      if (!response.ok && response.status !== 400) {
        throw new GoogleCalendarApiError('Unable to revoke Google token', response.status);
      }
    },

    async updateEvent(input) {
      await writeEvent('PUT', input);
    },
  };
}

function eventBody(event: GoogleCalendarEvent): Record<string, unknown> {
  return {
    description: event.description,
    end: {
      date: event.endDate,
    },
    extendedProperties: {
      private: event.extendedProperties,
    },
    id: event.id,
    reminders: {
      overrides: [
        {
          method: 'popup',
          minutes: event.remindersMinutes,
        },
      ],
      useDefault: false,
    },
    start: {
      date: event.startDate,
    },
    summary: event.summary,
    transparency: 'transparent',
    visibility: 'private',
  };
}

async function requestEmpty(
  url: string,
  {
    accessToken,
    method,
  }: {
    accessToken: string;
    method: 'DELETE';
  },
): Promise<void> {
  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    method,
  });

  if (!response.ok) {
    throw new GoogleCalendarApiError('Google Calendar request failed', response.status);
  }
}

async function requestJson<T>(
  url: string,
  {
    accessToken,
    body,
    method,
    parse,
  }: {
    accessToken: string;
    body?: Record<string, unknown>;
    method: 'GET' | 'POST' | 'PUT';
    parse: (value: unknown) => T;
  },
): Promise<T> {
  const response = await fetch(url, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(body === undefined
        ? {}
        : {
            'content-type': 'application/json',
          }),
    },
    method,
  });

  if (!response.ok) {
    throw new GoogleCalendarApiError('Google Calendar request failed', response.status);
  }

  return parse(await response.json());
}

async function requestToken(params: URLSearchParams): Promise<GoogleTokenResponse> {
  const response = await fetch(tokenUrl, {
    body: params,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new GoogleCalendarApiError('Google OAuth request failed', response.status);
  }

  return parseTokenResponse(await response.json());
}

async function writeEvent(
  method: 'POST' | 'PUT',
  input: GoogleCalendarEventWriteInput,
): Promise<void> {
  const baseUrl = `${calendarApiBaseUrl}/calendars/${encodeURIComponent(
    input.calendarId,
  )}/events`;
  const url =
    method === 'POST'
      ? baseUrl
      : `${baseUrl}/${encodeURIComponent(input.event.id)}`;

  await requestJson(url, {
    accessToken: input.accessToken,
    body: eventBody(input.event),
    method,
    parse: () => ({}),
  });
}

function parseCalendarList(value: unknown): { items: GoogleCalendarSummary[] } {
  if (!isRecord(value)) {
    return { items: [] };
  }

  const items = Array.isArray(value.items) ? value.items : [];

  return {
    items: items.map(parseCalendarSummary).filter(isCalendarSummary),
  };
}

function parseCalendarSummary(value: unknown): GoogleCalendarSummary {
  if (!isRecord(value)) {
    throw new Error('Invalid Google Calendar response');
  }

  const id = readString(value.id);
  const summary = readString(value.summary);

  if (id === null || summary === null) {
    throw new Error('Invalid Google Calendar response');
  }

  return { id, summary };
}

function parseTokenResponse(value: unknown): GoogleTokenResponse {
  if (!isRecord(value)) {
    throw new Error('Invalid Google OAuth response');
  }

  const accessToken = readString(value.access_token);

  if (accessToken === null) {
    throw new Error('Invalid Google OAuth response');
  }

  return {
    accessToken,
    expiresIn: readNumber(value.expires_in),
    refreshToken: readString(value.refresh_token),
    scope: readString(value.scope),
  };
}

function isCalendarSummary(
  value: GoogleCalendarSummary | null,
): value is GoogleCalendarSummary {
  return value !== null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}
