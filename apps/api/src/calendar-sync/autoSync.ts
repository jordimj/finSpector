import { getGoogleCalendarConfig } from './config.js';
import { createGoogleCalendarClient } from './googleClient.js';
import { getGoogleIntegration } from './repository.js';
import {
  createDefaultSecretStore,
  type SecretStore,
} from './secretStore.js';
import { syncGoogleCalendar, type CalendarSyncResult } from './service.js';
import type {
  CalendarIntegrationRow,
  GoogleCalendarClient,
  GoogleCalendarConfig,
} from './types.js';

export type CalendarAutoSyncLogger = {
  warn(input: unknown, message?: string): void;
};

export type CalendarAutoSyncDependencies = {
  client?: GoogleCalendarClient | null;
  config?: GoogleCalendarConfig | null;
  getIntegration?: () => Promise<CalendarIntegrationRow | null>;
  logger?: CalendarAutoSyncLogger;
  secretStore?: SecretStore;
  sync?: (input: {
    client: GoogleCalendarClient;
    integration: CalendarIntegrationRow;
    secretStore: SecretStore;
  }) => Promise<CalendarSyncResult>;
};

export async function syncGoogleCalendarAfterReminderChange({
  client: injectedClient,
  config: injectedConfig,
  getIntegration: readIntegration = getGoogleIntegration,
  logger,
  secretStore = createDefaultSecretStore(),
  sync = syncGoogleCalendar,
}: CalendarAutoSyncDependencies = {}): Promise<void> {
  try {
    const config =
      injectedConfig === undefined ? getGoogleCalendarConfig() : injectedConfig;
    const client =
      injectedClient === undefined
        ? config === null
          ? null
          : createGoogleCalendarClient(config)
        : injectedClient;

    if (config === null || client === null || !(await secretStore.isAvailable())) {
      return;
    }

    const integration = await readIntegration();

    if (
      integration === null ||
      integration.status === 'disconnected' ||
      integration.calendar_id === null ||
      integration.token_ref === null
    ) {
      return;
    }

    await sync({
      client,
      integration,
      secretStore,
    });
  } catch (error) {
    logger?.warn(
      {
        err: error,
      },
      'Automatic Google Calendar sync failed',
    );
  }
}
