import type { PaymentReminderOccurrence } from '@finance/shared';
import { materializePaymentReminderOccurrences } from '../payment-reminders/materialize.js';
import { occurrenceKey } from '../payment-reminders/occurrences.js';
import { getGoogleCalendarConfig } from './config.js';
import { GoogleCalendarApiError } from './googleClient.js';
import {
  isCalendarSyncOccurrence,
  planGoogleCalendarSync,
} from './googleEvents.js';
import { createOAuthState, createPkceVerifier, toPkceChallenge } from './oauth.js';
import {
  consumeCalendarOauthState,
  disconnectGoogleIntegration,
  getActiveCalendarEventSyncs,
  getGoogleIntegration,
  markActiveCalendarEventSyncsDeleted,
  markCalendarEventSyncDeleted,
  markGoogleIntegrationError,
  markGoogleIntegrationSynced,
  saveCalendarOauthState,
  upsertCalendarEventSync,
  upsertGoogleIntegration,
} from './repository.js';
import type { SecretStore } from './secretStore.js';
import {
  GOOGLE_CALENDAR_NAME,
  GOOGLE_CALENDAR_SCOPE,
  GOOGLE_CALENDAR_SYNC_DAYS,
  type CalendarIntegrationRow,
  type CalendarSyncStatusResponse,
  type GoogleCalendarClient,
  type GoogleCalendarConfig,
  type GoogleCalendarEvent,
} from './types.js';

const googleRefreshTokenRef = 'google:calendar:refresh_token';
const genericSyncFailureMessage = 'Google Calendar sync failed';
const genericCleanupFailureMessage = 'Google Calendar cleanup failed';

export type CalendarSyncResult = {
  deleted: number;
  inserted: number;
  skipped: number;
  updated: number;
};

export type CalendarDeleteEventsResult = {
  deleted: number;
};

type GoogleCalendarTarget = {
  id: string;
  summary: string;
};

export type CalendarSyncRepository = {
  getGoogleIntegration(): Promise<CalendarIntegrationRow | null>;
  markActiveCalendarEventSyncsDeleted(integrationId: string): Promise<number>;
};

export const defaultCalendarSyncRepository: CalendarSyncRepository = {
  getGoogleIntegration,
  markActiveCalendarEventSyncsDeleted,
};

export async function buildGoogleCalendarStatus({
  config,
  secretStore,
}: {
  config: GoogleCalendarConfig | null;
  secretStore: SecretStore;
}): Promise<CalendarSyncStatusResponse> {
  if (config === null) {
    return emptyStatus('notConfigured', 'missingConfig');
  }

  if (!(await secretStore.isAvailable())) {
    return emptyStatus('notConfigured', 'keychainUnavailable');
  }

  const integration = await getGoogleIntegration();

  if (integration === null || integration.status === 'disconnected') {
    return emptyStatus('notConnected', null);
  }

  return {
    accountEmail: integration.account_email,
    calendarId: integration.calendar_id,
    calendarName: integration.calendar_name,
    lastError: integration.last_error,
    lastSyncedAt: integration.last_synced_at,
    reason: null,
    state:
      integration.status === 'error'
        ? 'syncFailed'
        : integration.last_synced_at === null
          ? 'needsSync'
          : 'connected',
  };
}

export async function createGoogleCalendarConnectUrl({
  client,
  now = new Date(),
  redirectPath = '/upcoming',
}: {
  client: GoogleCalendarClient;
  now?: Date;
  redirectPath?: string;
}): Promise<string> {
  const state = createOAuthState();
  const codeVerifier = createPkceVerifier();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

  await saveCalendarOauthState({
    codeVerifier,
    expiresAt,
    redirectPath,
    state,
  });

  return client.buildAuthorizationUrl({
    codeChallenge: toPkceChallenge(codeVerifier),
    state,
  });
}

export async function completeGoogleCalendarConnection({
  client,
  code,
  now = new Date(),
  secretStore,
  state,
}: {
  client: GoogleCalendarClient;
  code: string;
  now?: Date;
  secretStore: SecretStore;
  state: string;
}): Promise<{ redirectPath: string }> {
  const oauthState = await consumeCalendarOauthState(state, now);

  if (oauthState === null) {
    throw Object.assign(new Error('Invalid Google Calendar OAuth state'), {
      statusCode: 400,
    });
  }

  const tokens = await client.exchangeCodeForTokens({
    code,
    codeVerifier: oauthState.code_verifier,
  });

  if (tokens.refreshToken === null) {
    throw Object.assign(
      new Error('Google did not return an offline refresh token'),
      {
        statusCode: 400,
      },
    );
  }

  await secretStore.set(googleRefreshTokenRef, tokens.refreshToken);

  const existingIntegration = await getGoogleIntegration();
  const calendar = await resolveGoogleCalendarForConnection({
    accessToken: tokens.accessToken,
    client,
    preferredCalendar: existingIntegration?.calendar_id
      ? {
          id: existingIntegration.calendar_id,
          summary: existingIntegration.calendar_name,
        }
      : null,
  });
  const integration = await upsertGoogleIntegration({
    accountEmail: null,
    calendarId: calendar.id,
    calendarName: calendar.summary,
    providerAccountId: null,
    scopes: scopesFromToken(tokens.scope),
    tokenRef: googleRefreshTokenRef,
  });

  if (
    existingIntegration?.calendar_id !== null &&
    existingIntegration?.calendar_id !== undefined &&
    existingIntegration.calendar_id !== calendar.id
  ) {
    await markActiveCalendarEventSyncsDeleted(integration.id);
  }

  await syncGoogleCalendar({
    client,
    integration,
    secretStore,
  });

  return {
    redirectPath: oauthState.redirect_path,
  };
}

export async function disconnectGoogleCalendar({
  client,
  secretStore,
}: {
  client: GoogleCalendarClient;
  secretStore: SecretStore;
}): Promise<void> {
  const integration = await getGoogleIntegration();
  const tokenRef = integration?.token_ref ?? googleRefreshTokenRef;
  const refreshToken = await secretStore.get(tokenRef);

  if (refreshToken !== null) {
    await client.revokeToken(refreshToken);
  }

  await secretStore.delete(tokenRef);
  await disconnectGoogleIntegration();
}

export async function deleteGoogleCalendarEvents({
  client,
  repository = defaultCalendarSyncRepository,
  secretStore,
}: {
  client: GoogleCalendarClient;
  repository?: CalendarSyncRepository;
  secretStore: SecretStore;
}): Promise<CalendarDeleteEventsResult> {
  const activeIntegration = await repository.getGoogleIntegration();

  if (
    activeIntegration === null ||
    activeIntegration.status === 'disconnected' ||
    activeIntegration.calendar_id === null ||
    activeIntegration.token_ref === null
  ) {
    throw Object.assign(new Error('Google Calendar is not connected'), {
      statusCode: 400,
    });
  }

  try {
    const refreshToken = await secretStore.get(activeIntegration.token_ref);

    if (refreshToken === null) {
      throw new Error('Google Calendar token is missing from Keychain');
    }

    const token = await client.refreshAccessToken(refreshToken);
    const calendarId = activeIntegration.calendar_id;
    const targets = await googleCalendarDeletionTargets({
      accessToken: token.accessToken,
      activeIntegration,
      calendarId,
      client,
    });
    let deleted = 0;

    for (const target of targets) {
      deleted += await deleteGoogleCalendarEventsFromTarget({
        accessToken: token.accessToken,
        calendarId: target.id,
        client,
      });
    }

    await repository.markActiveCalendarEventSyncsDeleted(activeIntegration.id);

    return { deleted };
  } catch (error) {
    await markGoogleIntegrationError(
      activeIntegration.id,
      publicGoogleFailureMessage(error, genericCleanupFailureMessage),
    );
    throw Object.assign(new Error(genericCleanupFailureMessage), {
      statusCode: 502,
    });
  }
}

export async function syncGoogleCalendar({
  client,
  integration,
  secretStore,
}: {
  client: GoogleCalendarClient;
  integration?: CalendarIntegrationRow;
  secretStore: SecretStore;
}): Promise<CalendarSyncResult> {
  const activeIntegration = integration ?? (await getGoogleIntegration());

  if (
    activeIntegration === null ||
    activeIntegration.status === 'disconnected' ||
    activeIntegration.calendar_id === null ||
    activeIntegration.token_ref === null
  ) {
    throw Object.assign(new Error('Google Calendar is not connected'), {
      statusCode: 400,
    });
  }

  try {
    const refreshToken = await secretStore.get(activeIntegration.token_ref);

    if (refreshToken === null) {
      throw new Error('Google Calendar token is missing from Keychain');
    }

    const token = await client.refreshAccessToken(refreshToken);
    const calendarId = activeIntegration.calendar_id;
    const integration = await ensureGoogleCalendarTargetForSync({
      accessToken: token.accessToken,
      activeIntegration,
      calendarId,
      client,
    });
    const syncCalendarId = integration.calendar_id;

    if (syncCalendarId === null) {
      throw new Error('Google Calendar target is missing');
    }

    const materialized = await materializePaymentReminderOccurrences({
      days: GOOGLE_CALENDAR_SYNC_DAYS,
    });
    const existingSyncs = await getActiveCalendarEventSyncs(integration.id);
    const plan = planGoogleCalendarSync({
      existingSyncs,
      occurrences: materialized.occurrences,
    });

    for (const action of plan.insert) {
      await insertOrUpdateEvent({
        accessToken: token.accessToken,
        calendarId: syncCalendarId,
        client,
        event: action.event,
      });
      await saveSyncedEvent(integration.id, action.occurrence, action.event);
    }

    for (const action of plan.update) {
      await updateOrInsertEvent({
        accessToken: token.accessToken,
        calendarId: syncCalendarId,
        client,
        event: action.event,
      });
      await saveSyncedEvent(integration.id, action.occurrence, action.event);
    }

    for (const action of plan.delete) {
      await deleteManagedEvent({
        accessToken: token.accessToken,
        calendarId: syncCalendarId,
        client,
        eventId: action.syncRow.google_event_id,
      });
      await markCalendarEventSyncDeleted(action.syncRow.id);
    }

    await markGoogleIntegrationSynced(integration.id);

    return {
      deleted: plan.delete.length,
      inserted: plan.insert.length,
      skipped: plan.skip.length,
      updated: plan.update.length,
    };
  } catch (error) {
    await markGoogleIntegrationError(
      activeIntegration.id,
      publicGoogleFailureMessage(error, genericSyncFailureMessage),
    );
    throw Object.assign(new Error(genericSyncFailureMessage), {
      statusCode: 502,
    });
  }
}

export function getConfiguredGoogleCalendarConfig(): GoogleCalendarConfig | null {
  return getGoogleCalendarConfig();
}

export function openCalendarOccurrences(
  occurrences: PaymentReminderOccurrence[],
): PaymentReminderOccurrence[] {
  return occurrences.filter(isCalendarSyncOccurrence);
}

export async function resolveGoogleCalendarForConnection({
  accessToken,
  client,
  preferredCalendar,
}: {
  accessToken: string;
  client: GoogleCalendarClient;
  preferredCalendar: GoogleCalendarTarget | null;
}): Promise<GoogleCalendarTarget> {
  if (
    preferredCalendar !== null &&
    (await canUseCalendar({
      accessToken,
      calendarId: preferredCalendar.id,
      client,
    }))
  ) {
    return preferredCalendar;
  }

  const calendars = await listAvailableCalendars(client, accessToken);
  const existing = calendars.find(
    (calendar) => calendar.summary === GOOGLE_CALENDAR_NAME,
  );

  return existing ?? client.createCalendar(accessToken, GOOGLE_CALENDAR_NAME);
}

async function deleteManagedEvent({
  accessToken,
  calendarId,
  client,
  eventId,
}: {
  accessToken: string;
  calendarId: string;
  client: GoogleCalendarClient;
  eventId: string;
}): Promise<boolean> {
  try {
    await client.deleteEvent({ accessToken, calendarId, eventId });
    return true;
  } catch (error) {
    if (isGoogleStatus(error, 404)) {
      return false;
    }

    throw error;
  }
}

async function listAvailableCalendars(
  client: GoogleCalendarClient,
  accessToken: string,
) {
  try {
    return await client.listCalendars(accessToken);
  } catch (error) {
    if (isGoogleStatus(error, 403)) {
      return [];
    }

    throw error;
  }
}

async function canUseCalendar({
  accessToken,
  calendarId,
  client,
}: {
  accessToken: string;
  calendarId: string;
  client: GoogleCalendarClient;
}): Promise<boolean> {
  try {
    await client.listEvents({
      accessToken,
      calendarId,
      pageToken: null,
    });

    return true;
  } catch (error) {
    if (isGoogleStatus(error, 403) || isGoogleStatus(error, 404)) {
      return false;
    }

    throw error;
  }
}

async function ensureGoogleCalendarTargetForSync({
  accessToken,
  activeIntegration,
  calendarId,
  client,
}: {
  accessToken: string;
  activeIntegration: CalendarIntegrationRow;
  calendarId: string;
  client: GoogleCalendarClient;
}): Promise<CalendarIntegrationRow> {
  if (
    await canUseCalendar({
      accessToken,
      calendarId,
      client,
    })
  ) {
    return activeIntegration;
  }

  const calendar = await resolveGoogleCalendarForConnection({
    accessToken,
    client,
    preferredCalendar: null,
  });
  const integration = await upsertGoogleIntegration({
    accountEmail: activeIntegration.account_email,
    calendarId: calendar.id,
    calendarName: calendar.summary,
    providerAccountId: activeIntegration.provider_account_id,
    scopes: activeIntegration.scopes,
    tokenRef: activeIntegration.token_ref ?? googleRefreshTokenRef,
  });

  await markActiveCalendarEventSyncsDeleted(integration.id);

  return integration;
}

async function googleCalendarDeletionTargets({
  accessToken,
  activeIntegration,
  calendarId,
  client,
}: {
  accessToken: string;
  activeIntegration: CalendarIntegrationRow;
  calendarId: string;
  client: GoogleCalendarClient;
}): Promise<GoogleCalendarTarget[]> {
  const calendars = await listAvailableCalendars(client, accessToken);
  const targets = new Map<string, GoogleCalendarTarget>();

  targets.set(calendarId, {
    id: calendarId,
    summary: activeIntegration.calendar_name,
  });

  for (const calendar of calendars) {
    if (calendar.summary === GOOGLE_CALENDAR_NAME) {
      targets.set(calendar.id, calendar);
    }
  }

  return [...targets.values()];
}

async function deleteGoogleCalendarEventsFromTarget({
  accessToken,
  calendarId,
  client,
}: {
  accessToken: string;
  calendarId: string;
  client: GoogleCalendarClient;
}): Promise<number> {
  let pageToken: string | null = null;
  const eventIds: string[] = [];
  let deleted = 0;

  do {
    let page;

    try {
      page = await client.listEvents({
        accessToken,
        calendarId,
        pageToken,
      });
    } catch (error) {
      if (isGoogleStatus(error, 403) || isGoogleStatus(error, 404)) {
        return deleted;
      }

      throw error;
    }

    eventIds.push(...page.events.map((event) => event.id));

    pageToken = page.nextPageToken;
  } while (pageToken !== null);

  for (const eventId of eventIds) {
    const didDelete = await deleteManagedEvent({
      accessToken,
      calendarId,
      client,
      eventId,
    });

    if (didDelete) {
      deleted += 1;
    }
  }

  return deleted;
}

async function insertOrUpdateEvent({
  accessToken,
  calendarId,
  client,
  event,
}: {
  accessToken: string;
  calendarId: string;
  client: GoogleCalendarClient;
  event: GoogleCalendarEvent;
}): Promise<void> {
  try {
    await client.insertEvent({ accessToken, calendarId, event });
  } catch (error) {
    if (isGoogleStatus(error, 409)) {
      await client.updateEvent({ accessToken, calendarId, event });
      return;
    }

    throw error;
  }
}

async function saveSyncedEvent(
  integrationId: string,
  occurrence: PaymentReminderOccurrence,
  event: GoogleCalendarEvent,
): Promise<void> {
  await upsertCalendarEventSync({
    dueDate: occurrence.dueDate,
    googleEventId: event.id,
    integrationId,
    occurrenceKey: occurrenceKey({
      dueDate: occurrence.dueDate,
      reminderId: occurrence.reminderId,
    }),
    payloadHash: event.payloadHash,
    paymentReminderId: occurrence.reminderId,
  });
}

function scopesFromToken(scope: string | null): string[] {
  if (scope === null) {
    return [GOOGLE_CALENDAR_SCOPE];
  }

  return scope.split(' ').filter((value) => value.length > 0);
}

function emptyStatus(
  state: CalendarSyncStatusResponse['state'],
  reason: string | null,
): CalendarSyncStatusResponse {
  return {
    accountEmail: null,
    calendarId: null,
    calendarName: GOOGLE_CALENDAR_NAME,
    lastError: null,
    lastSyncedAt: null,
    reason,
    state,
  };
}

function isGoogleStatus(error: unknown, status: number): boolean {
  return error instanceof GoogleCalendarApiError && error.status === status;
}

function publicGoogleFailureMessage(error: unknown, fallback: string): string {
  if (error instanceof GoogleCalendarApiError) {
    return `${fallback} (${error.status})`;
  }

  return fallback;
}

async function updateOrInsertEvent({
  accessToken,
  calendarId,
  client,
  event,
}: {
  accessToken: string;
  calendarId: string;
  client: GoogleCalendarClient;
  event: GoogleCalendarEvent;
}): Promise<void> {
  try {
    await client.updateEvent({ accessToken, calendarId, event });
  } catch (error) {
    if (isGoogleStatus(error, 404)) {
      await client.insertEvent({ accessToken, calendarId, event });
      return;
    }

    throw error;
  }
}
