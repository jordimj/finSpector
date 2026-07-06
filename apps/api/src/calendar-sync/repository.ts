import { pool } from '@finance/db';
import {
  GOOGLE_CALENDAR_PROVIDER,
  type CalendarEventSyncRow,
  type CalendarIntegrationRow,
  type CalendarIntegrationStatus,
  type CalendarOauthStateRow,
} from './types.js';

export async function consumeCalendarOauthState(
  state: string,
  now = new Date(),
): Promise<CalendarOauthStateRow | null> {
  const result = await pool.query<CalendarOauthStateRow>(
    `
      update calendar_oauth_states
      set consumed_at = $2
      where state = $1
        and consumed_at is null
        and expires_at > $2
      returning
        state,
        code_verifier,
        redirect_path,
        created_at::text as created_at,
        expires_at::text as expires_at,
        consumed_at::text as consumed_at;
    `,
    [state, now.toISOString()],
  );

  return result.rows[0] ?? null;
}

export async function disconnectGoogleIntegration(): Promise<void> {
  await pool.query(
    `
      update calendar_integrations
      set
        status = 'disconnected',
        token_ref = null,
        last_error = null,
        updated_at = now()
      where provider = $1;
    `,
    [GOOGLE_CALENDAR_PROVIDER],
  );
}

export async function getActiveCalendarEventSyncs(
  integrationId: string,
): Promise<CalendarEventSyncRow[]> {
  const result = await pool.query<CalendarEventSyncRow>(
    `
      select
        id,
        integration_id,
        payment_reminder_id,
        to_char(due_date, 'YYYY-MM-DD') as due_date,
        google_event_id,
        occurrence_key,
        payload_hash,
        last_synced_at::text as last_synced_at,
        deleted_at::text as deleted_at,
        created_at::text as created_at,
        updated_at::text as updated_at
      from calendar_event_syncs
      where integration_id = $1
        and deleted_at is null;
    `,
    [integrationId],
  );

  return result.rows;
}

export async function getGoogleIntegration(): Promise<CalendarIntegrationRow | null> {
  const result = await pool.query<CalendarIntegrationRow>(
    `
      ${integrationSelectSql()}
      where provider = $1;
    `,
    [GOOGLE_CALENDAR_PROVIDER],
  );

  return result.rows[0] ?? null;
}

export async function markCalendarEventSyncDeleted(id: string): Promise<void> {
  await pool.query(
    `
      update calendar_event_syncs
      set deleted_at = now(), updated_at = now()
      where id = $1;
    `,
    [id],
  );
}

export async function markGoogleIntegrationError(
  id: string,
  message: string,
): Promise<void> {
  await updateGoogleIntegrationStatus({
    id,
    lastError: message,
    status: 'error',
  });
}

export async function markGoogleIntegrationSynced(id: string): Promise<void> {
  await pool.query(
    `
      update calendar_integrations
      set
        status = 'connected',
        last_error = null,
        last_synced_at = now(),
        updated_at = now()
      where id = $1;
    `,
    [id],
  );
}

export async function saveCalendarOauthState({
  codeVerifier,
  expiresAt,
  redirectPath,
  state,
}: {
  codeVerifier: string;
  expiresAt: Date;
  redirectPath: string;
  state: string;
}): Promise<void> {
  await pool.query(
    `
      insert into calendar_oauth_states (
        state,
        code_verifier,
        redirect_path,
        expires_at
      )
      values ($1, $2, $3, $4);
    `,
    [state, codeVerifier, redirectPath, expiresAt.toISOString()],
  );
}

export async function upsertCalendarEventSync({
  dueDate,
  googleEventId,
  integrationId,
  occurrenceKey,
  payloadHash,
  paymentReminderId,
}: {
  dueDate: string;
  googleEventId: string;
  integrationId: string;
  occurrenceKey: string;
  payloadHash: string;
  paymentReminderId: string;
}): Promise<void> {
  await pool.query(
    `
      insert into calendar_event_syncs (
        integration_id,
        payment_reminder_id,
        due_date,
        google_event_id,
        occurrence_key,
        payload_hash,
        last_synced_at,
        deleted_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, now(), null, now())
      on conflict (integration_id, payment_reminder_id, due_date) do update
      set
        google_event_id = excluded.google_event_id,
        occurrence_key = excluded.occurrence_key,
        payload_hash = excluded.payload_hash,
        last_synced_at = now(),
        deleted_at = null,
        updated_at = now();
    `,
    [
      integrationId,
      paymentReminderId,
      dueDate,
      googleEventId,
      occurrenceKey,
      payloadHash,
    ],
  );
}

export async function upsertGoogleIntegration({
  accountEmail,
  calendarId,
  calendarName,
  providerAccountId,
  scopes,
  tokenRef,
}: {
  accountEmail: string | null;
  calendarId: string;
  calendarName: string;
  providerAccountId: string | null;
  scopes: string[];
  tokenRef: string;
}): Promise<CalendarIntegrationRow> {
  const result = await pool.query<CalendarIntegrationRow>(
    `
      insert into calendar_integrations (
        provider,
        provider_account_id,
        account_email,
        calendar_id,
        calendar_name,
        token_ref,
        scopes,
        status,
        last_error,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, 'connected', null, now())
      on conflict (provider) do update
      set
        provider_account_id = excluded.provider_account_id,
        account_email = excluded.account_email,
        calendar_id = excluded.calendar_id,
        calendar_name = excluded.calendar_name,
        token_ref = excluded.token_ref,
        scopes = excluded.scopes,
        status = 'connected',
        last_error = null,
        updated_at = now()
      returning
        id,
        provider,
        provider_account_id,
        account_email,
        calendar_id,
        calendar_name,
        token_ref,
        scopes,
        status,
        last_synced_at::text as last_synced_at,
        last_error,
        created_at::text as created_at,
        updated_at::text as updated_at;
    `,
    [
      GOOGLE_CALENDAR_PROVIDER,
      providerAccountId,
      accountEmail,
      calendarId,
      calendarName,
      tokenRef,
      scopes,
    ],
  );
  const row = result.rows[0];

  if (row === undefined) {
    throw new Error('Unable to save Google Calendar integration');
  }

  return row;
}

async function updateGoogleIntegrationStatus({
  id,
  lastError,
  status,
}: {
  id: string;
  lastError: string | null;
  status: CalendarIntegrationStatus;
}): Promise<void> {
  await pool.query(
    `
      update calendar_integrations
      set
        status = $2,
        last_error = $3,
        updated_at = now()
      where id = $1;
    `,
    [id, status, lastError],
  );
}

function integrationSelectSql(): string {
  return `
    select
      id,
      provider,
      provider_account_id,
      account_email,
      calendar_id,
      calendar_name,
      token_ref,
      scopes,
      status,
      last_synced_at::text as last_synced_at,
      last_error,
      created_at::text as created_at,
      updated_at::text as updated_at
    from calendar_integrations
  `;
}
