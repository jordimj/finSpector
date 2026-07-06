import type { PaymentReminderOccurrence } from '@finance/shared';

export const GOOGLE_CALENDAR_PROVIDER = 'google' as const;
export const GOOGLE_CALENDAR_NAME = 'FinHunter Reminders';
export const GOOGLE_CALENDAR_SCOPE =
  'https://www.googleapis.com/auth/calendar.app.created';
export const GOOGLE_CALENDAR_SYNC_DAYS = 365;

export type CalendarIntegrationStatus =
  | 'connected'
  | 'disconnected'
  | 'error';

export type CalendarIntegrationRow = {
  id: string;
  provider: typeof GOOGLE_CALENDAR_PROVIDER;
  provider_account_id: string | null;
  account_email: string | null;
  calendar_id: string | null;
  calendar_name: string;
  token_ref: string | null;
  scopes: string[];
  status: CalendarIntegrationStatus;
  last_synced_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type CalendarEventSyncRow = {
  id: string;
  integration_id: string;
  payment_reminder_id: string;
  due_date: string;
  google_event_id: string;
  occurrence_key: string;
  payload_hash: string;
  last_synced_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CalendarOauthStateRow = {
  state: string;
  code_verifier: string;
  redirect_path: string;
  created_at: string;
  expires_at: string;
  consumed_at: string | null;
};

export type GoogleCalendarConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type GoogleTokenResponse = {
  accessToken: string;
  expiresIn: number | null;
  refreshToken: string | null;
  scope: string | null;
};

export type GoogleCalendarSummary = {
  id: string;
  summary: string;
};

export type GoogleCalendarListedEvent = {
  id: string;
};

export type GoogleCalendarEventListPage = {
  events: GoogleCalendarListedEvent[];
  nextPageToken: string | null;
};

export type GoogleCalendarEvent = {
  description: string;
  endDate: string;
  extendedProperties: Record<string, string>;
  id: string;
  payloadHash: string;
  remindersMinutes: number;
  startDate: string;
  summary: string;
};

export type GoogleCalendarClient = {
  buildAuthorizationUrl(input: {
    codeChallenge: string;
    state: string;
  }): string;
  exchangeCodeForTokens(input: {
    code: string;
    codeVerifier: string;
  }): Promise<GoogleTokenResponse>;
  refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse>;
  revokeToken(token: string): Promise<void>;
  listCalendars(accessToken: string): Promise<GoogleCalendarSummary[]>;
  listEvents(
    input: GoogleCalendarEventListInput,
  ): Promise<GoogleCalendarEventListPage>;
  createCalendar(
    accessToken: string,
    summary: string,
  ): Promise<GoogleCalendarSummary>;
  insertEvent(input: GoogleCalendarEventWriteInput): Promise<void>;
  updateEvent(input: GoogleCalendarEventWriteInput): Promise<void>;
  deleteEvent(input: GoogleCalendarEventDeleteInput): Promise<void>;
};

export type GoogleCalendarEventWriteInput = {
  accessToken: string;
  calendarId: string;
  event: GoogleCalendarEvent;
};

export type GoogleCalendarEventDeleteInput = {
  accessToken: string;
  calendarId: string;
  eventId: string;
};

export type GoogleCalendarEventListInput = {
  accessToken: string;
  calendarId: string;
  pageToken?: string | null;
};

export type CalendarSyncInsertAction = {
  event: GoogleCalendarEvent;
  occurrence: PaymentReminderOccurrence;
  type: 'insert';
};

export type CalendarSyncUpdateAction = {
  event: GoogleCalendarEvent;
  occurrence: PaymentReminderOccurrence;
  type: 'update';
};

export type CalendarSyncDeleteAction = {
  syncRow: CalendarEventSyncRow;
  type: 'delete';
};

export type CalendarSyncSkipAction = {
  event: GoogleCalendarEvent;
  occurrence: PaymentReminderOccurrence;
  syncRow: CalendarEventSyncRow;
  type: 'skip';
};

export type CalendarSyncAction =
  | CalendarSyncDeleteAction
  | CalendarSyncInsertAction
  | CalendarSyncSkipAction
  | CalendarSyncUpdateAction;

export type CalendarSyncPlan = {
  delete: CalendarSyncDeleteAction[];
  insert: CalendarSyncInsertAction[];
  skip: CalendarSyncSkipAction[];
  update: CalendarSyncUpdateAction[];
};

export type CalendarSyncStatusResponse = {
  accountEmail: string | null;
  calendarId: string | null;
  calendarName: string;
  lastError: string | null;
  lastSyncedAt: string | null;
  reason: string | null;
  state:
    | 'connected'
    | 'needsSync'
    | 'notConfigured'
    | 'notConnected'
    | 'syncFailed';
};
