import type { GoogleCalendarConfig } from './types.js';

export function getGoogleCalendarConfig(
  env: NodeJS.ProcessEnv = process.env,
): GoogleCalendarConfig | null {
  const clientId = env.GOOGLE_CALENDAR_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim();
  const redirectUri = env.GOOGLE_CALENDAR_REDIRECT_URI?.trim();

  if (
    clientId === undefined ||
    clientId.length === 0 ||
    clientSecret === undefined ||
    clientSecret.length === 0 ||
    redirectUri === undefined ||
    redirectUri.length === 0
  ) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}
