import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import Fastify from 'fastify';
import { buildApp } from './app.js';
import { registerWebAppRoutes } from './web-app.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) =>
      rm(dir, {
        force: true,
        recursive: true,
      }),
    ),
  );
});

describe('registerWebAppRoutes', () => {
  it('serves built assets from the dist directory', async () => {
    const webDistDir = await createWebDist();
    const app = Fastify({ logger: false });

    registerWebAppRoutes(app, webDistDir);

    const response = await app.inject({
      method: 'GET',
      url: '/assets/index.js',
    });

    assert.equal(response.statusCode, 200);
    assert.match(response.headers['content-type']?.toString() ?? '', /javascript/);
    assert.equal(response.body, 'console.log("ok");');

    await app.close();
  });

  it('falls back to index.html for client routes', async () => {
    const webDistDir = await createWebDist();
    const app = Fastify({ logger: false });

    registerWebAppRoutes(app, webDistDir);

    const response = await app.inject({
      method: 'GET',
      url: '/tools/import-assistant',
    });

    assert.equal(response.statusCode, 200);
    assert.match(response.headers['content-type']?.toString() ?? '', /text\/html/);
    assert.equal(response.body, '<div id="root"></div>');

    await app.close();
  });

  it('keeps missing API routes as JSON 404s', async () => {
    const webDistDir = await createWebDist();
    const app = Fastify({ logger: false });

    registerWebAppRoutes(app, webDistDir);

    const response = await app.inject({
      method: 'GET',
      url: '/api/missing',
    });

    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.json(), {
      error: 'Not Found',
      message: 'Route GET:/api/missing not found',
    });

    await app.close();
  });

  it('does not serve missing asset paths as index.html', async () => {
    const webDistDir = await createWebDist();
    const app = Fastify({ logger: false });

    registerWebAppRoutes(app, webDistDir);

    const response = await app.inject({
      method: 'GET',
      url: '/assets/missing.js',
    });

    assert.equal(response.statusCode, 404);

    await app.close();
  });

  it('does not force local HTTP clients to upgrade static assets to HTTPS', async () => {
    const webDistDir = await createWebDist();
    const app = buildApp({ webDistDir });

    const response = await app.inject({
      method: 'GET',
      url: '/',
    });

    const contentSecurityPolicy =
      response.headers['content-security-policy']?.toString() ?? '';

    assert.equal(response.statusCode, 200);
    assert.doesNotMatch(contentSecurityPolicy, /upgrade-insecure-requests/);
    assert.equal(response.headers['strict-transport-security'], undefined);

    await app.close();
  });
});

async function createWebDist(): Promise<string> {
  const webDistDir = await mkdtemp(join(tmpdir(), 'finance-web-dist-'));
  const assetsDir = join(webDistDir, 'assets');

  tempDirs.push(webDistDir);

  await mkdir(assetsDir);
  await writeFile(join(webDistDir, 'index.html'), '<div id="root"></div>');
  await writeFile(join(assetsDir, 'index.js'), 'console.log("ok");');

  return webDistDir;
}
