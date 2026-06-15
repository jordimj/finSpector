import { closeDb } from '@finance/db';
import { buildApp } from './app.js';

const app = buildApp();
const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? '0.0.0.0';

async function start(): Promise<void> {
  await app.listen({ port, host });
}

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  app.log.info({ signal }, 'Shutting down API server');
  await app.close();
  await closeDb();
}

process.once('SIGINT', (signal) => {
  shutdown(signal).catch((error: unknown) => {
    app.log.error(error);
    process.exit(1);
  });
});

process.once('SIGTERM', (signal) => {
  shutdown(signal).catch((error: unknown) => {
    app.log.error(error);
    process.exit(1);
  });
});

start().catch(async (error: unknown) => {
  app.log.error(error);
  await closeDb();
  process.exit(1);
});
