import { networkInterfaces, hostname as systemHostname } from 'node:os';
import { closeDb } from '@finance/db';
import { buildApp } from './app.js';

const app = buildApp();
const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? '127.0.0.1';

async function start(): Promise<void> {
  await app.listen({ port, host });
  logLanUrls();
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

function logLanUrls(): void {
  if (host !== '0.0.0.0') {
    return;
  }

  const localHostname = (process.env.LAN_HOSTNAME ?? systemHostname()).trim();
  const urls = [
    localHostname.length > 0 ? `http://${localHostname}.local:${port}` : null,
    ...getLanIpv4Addresses().map((address) => `http://${address}:${port}`),
  ].filter((url): url is string => url !== null);

  if (urls.length === 0) {
    return;
  }

  app.log.info(
    {
      urls,
    },
    'Open the app from another device on this Wi-Fi network',
  );
}

function getLanIpv4Addresses(): string[] {
  return Object.values(networkInterfaces())
    .flatMap((networkInterface) => networkInterface ?? [])
    .filter(
      (address) =>
        address.family === 'IPv4' &&
        !address.internal &&
        !address.address.startsWith('169.254.'),
    )
    .map((address) => address.address);
}
