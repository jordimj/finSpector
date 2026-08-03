import type { FastifyInstance } from 'fastify';

type AccessControlOptions = {
  allowedHosts: string[] | null;
  allowedOrigins: string[] | null;
};

export function getAccessControlOptions(
  env: NodeJS.ProcessEnv,
): AccessControlOptions {
  return {
    allowedHosts: parseAllowedHosts(env.ALLOWED_HOSTS),
    allowedOrigins: parseAllowedOrigins(env.CORS_ORIGIN),
  };
}

export function registerAccessControl(
  app: FastifyInstance,
  options: AccessControlOptions,
): void {
  const allowedHosts = options.allowedHosts
    ? new Set(options.allowedHosts)
    : null;
  const allowedOrigins = options.allowedOrigins
    ? new Set(options.allowedOrigins)
    : null;

  if (allowedHosts === null && allowedOrigins === null) {
    return;
  }

  app.addHook('onRequest', async (request, reply) => {
    if (
      allowedHosts !== null &&
      !allowedHosts.has(normalizeHostname(request.hostname))
    ) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Request host is not allowed',
      });
    }

    const origin = request.headers.origin;

    if (
      allowedOrigins !== null &&
      origin !== undefined &&
      !isAllowedOrigin(allowedOrigins, origin)
    ) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Request origin is not allowed',
      });
    }
  });
}

function parseAllowedHosts(value: string | undefined): string[] | null {
  const values = parseConfiguredList(value, 'ALLOWED_HOSTS');

  return values?.map(normalizeHostname) ?? null;
}

function parseAllowedOrigins(value: string | undefined): string[] | null {
  const values = parseConfiguredList(value, 'CORS_ORIGIN');

  return values?.map(normalizeOrigin) ?? null;
}

function parseConfiguredList(
  value: string | undefined,
  variableName: string,
): string[] | null {
  if (value === undefined) {
    return null;
  }

  const values = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (values.length === 0) {
    throw new Error(`${variableName} must contain at least one value`);
  }

  return values;
}

function normalizeHostname(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, '');
}

function normalizeOrigin(value: string): string {
  let origin: string;

  try {
    origin = new URL(value).origin;
  } catch {
    throw new Error(`Invalid origin: ${value}`);
  }

  if (origin === 'null') {
    throw new Error(`Invalid origin: ${value}`);
  }

  return origin;
}

function isAllowedOrigin(allowedOrigins: Set<string>, value: string): boolean {
  try {
    return allowedOrigins.has(normalizeOrigin(value));
  } catch {
    return false;
  }
}
