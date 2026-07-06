export type GoogleCalendarSyncStatus = {
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

export type GoogleCalendarConnectResponse = {
  authorizationUrl: string;
};

export type GoogleCalendarSyncResult = {
  deleted: number;
  inserted: number;
  skipped: number;
  updated: number;
};

export type GoogleCalendarSyncResponse = {
  result: GoogleCalendarSyncResult;
};
