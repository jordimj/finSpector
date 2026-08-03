import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildApp } from './app.js';

const localAccessEnv = {
  ALLOWED_HOSTS: 'localhost,127.0.0.1',
  CORS_ORIGIN: 'http://localhost:4400,http://127.0.0.1:4400',
  LOG_LEVEL: 'silent',
};

describe('local access controls', () => {
  it('allows configured hosts and origins', async () => {
    const app = buildApp({ env: localAccessEnv });
    const response = await app.inject({
      headers: {
        host: 'localhost:4400',
        origin: 'http://localhost:4400',
      },
      method: 'GET',
      url: '/health',
    });

    await app.close();

    assert.equal(response.statusCode, 200);
    assert.equal(
      response.headers['access-control-allow-origin'],
      'http://localhost:4400',
    );
  });

  it('rejects hosts outside the configured allowlist', async () => {
    const app = buildApp({ env: localAccessEnv });
    const response = await app.inject({
      headers: {
        host: 'finhunter.example:4400',
      },
      method: 'GET',
      url: '/health',
    });

    await app.close();

    assert.equal(response.statusCode, 403);
    assert.deepEqual(response.json(), {
      error: 'Forbidden',
      message: 'Request host is not allowed',
    });
  });

  it('rejects browser origins outside the configured allowlist', async () => {
    const app = buildApp({ env: localAccessEnv });
    const response = await app.inject({
      headers: {
        host: 'localhost:4400',
        origin: 'https://example.com',
      },
      method: 'POST',
      url: '/api/calendar-sync/google/sync',
    });

    await app.close();

    assert.equal(response.statusCode, 403);
    assert.deepEqual(response.json(), {
      error: 'Forbidden',
      message: 'Request origin is not allowed',
    });
  });

  it('rejects malformed browser origins without raising a server error', async () => {
    const app = buildApp({ env: localAccessEnv });
    const response = await app.inject({
      headers: {
        host: 'localhost:4400',
        origin: 'not an origin',
      },
      method: 'GET',
      url: '/health',
    });

    await app.close();

    assert.equal(response.statusCode, 403);
    assert.deepEqual(response.json(), {
      error: 'Forbidden',
      message: 'Request origin is not allowed',
    });
  });

  it('allows non-browser clients that omit the Origin header', async () => {
    const app = buildApp({ env: localAccessEnv });
    const response = await app.inject({
      headers: {
        host: '127.0.0.1:4400',
      },
      method: 'GET',
      url: '/health',
    });

    await app.close();

    assert.equal(response.statusCode, 200);
  });

  it('preserves unrestricted development behavior when allowlists are unset', async () => {
    const app = buildApp({ env: { LOG_LEVEL: 'silent' } });
    const response = await app.inject({
      headers: {
        host: 'dev.example:4000',
        origin: 'https://dev.example',
      },
      method: 'GET',
      url: '/health',
    });

    await app.close();

    assert.equal(response.statusCode, 200);
    assert.equal(
      response.headers['access-control-allow-origin'],
      'https://dev.example',
    );
  });
});
