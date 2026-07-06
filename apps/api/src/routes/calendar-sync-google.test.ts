import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import Fastify from 'fastify';
import { InMemorySecretStore } from '../calendar-sync/secretStore.js';
import { registerGoogleCalendarSyncRoutes } from './calendar-sync-google.js';

describe('registerGoogleCalendarSyncRoutes', () => {
  it('reports not configured without touching storage', async () => {
    const app = Fastify({ logger: false });

    await app.register(registerGoogleCalendarSyncRoutes, {
      config: null,
      secretStore: new InMemorySecretStore(),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/status',
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json<{ state: string }>().state, 'notConfigured');

    await app.close();
  });

  it('rejects malformed callbacks', async () => {
    const app = Fastify({ logger: false });

    await app.register(registerGoogleCalendarSyncRoutes, {
      config: null,
      secretStore: new InMemorySecretStore(),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/callback',
    });

    assert.equal(response.statusCode, 400);

    await app.close();
  });
});
