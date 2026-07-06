import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { createGoogleCalendarClient } from './googleClient.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('createGoogleCalendarClient', () => {
  it('lists calendar events with pagination parameters', async () => {
    const requestedUrls: string[] = [];
    globalThis.fetch = async (input, init) => {
      requestedUrls.push(String(input));
      assert.equal(init?.method, 'GET');
      assert.deepEqual(init?.headers, {
        authorization: 'Bearer access-token',
      });

      return new Response(
        JSON.stringify({
          items: [{ id: 'event-1' }, { id: null }, { summary: 'No id' }],
          nextPageToken: 'next-page',
        }),
        {
          headers: {
            'content-type': 'application/json',
          },
          status: 200,
        },
      );
    };
    const client = createGoogleCalendarClient({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost/callback',
    });

    const page = await client.listEvents({
      accessToken: 'access-token',
      calendarId: 'calendar id',
      pageToken: 'page 2',
    });

    assert.deepEqual(page, {
      events: [{ id: 'event-1' }],
      nextPageToken: 'next-page',
    });
    assert.equal(requestedUrls.length, 1);
    assert.match(
      requestedUrls[0] ?? '',
      /\/calendars\/calendar%20id\/events\?/,
    );
    assert.match(requestedUrls[0] ?? '', /pageToken=page\+2/);
    assert.match(requestedUrls[0] ?? '', /showDeleted=false/);
    assert.match(requestedUrls[0] ?? '', /singleEvents=true/);
  });
});
