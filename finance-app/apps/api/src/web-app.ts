import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, normalize, resolve, sep } from 'node:path';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

type StaticFile = {
  contentType: string;
  path: string;
};

export function registerWebAppRoutes(
  app: FastifyInstance,
  webDistDir: string,
): void {
  const rootDir = resolve(webDistDir);
  const indexFile = resolve(rootDir, 'index.html');

  app.setNotFoundHandler(async (request, reply) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return sendRouteNotFound(request, reply);
    }

    const pathname = getRequestPathname(request);

    if (pathname === '/health' || pathname.startsWith('/api/')) {
      return sendRouteNotFound(request, reply);
    }

    const file = await findStaticFile(rootDir, indexFile, pathname);

    if (!file) {
      return sendRouteNotFound(request, reply);
    }

    return reply.type(file.contentType).send(createReadStream(file.path));
  });
}

async function findStaticFile(
  rootDir: string,
  indexFile: string,
  pathname: string,
): Promise<StaticFile | null> {
  const requestedFile = resolveSafePath(rootDir, pathname);

  if (!requestedFile) {
    return null;
  }

  const filePath = await getReadableFile(requestedFile);

  if (filePath) {
    return {
      contentType: getContentType(filePath),
      path: filePath,
    };
  }

  if (extname(pathname) !== '') {
    return null;
  }

  const fallbackFile = await getReadableFile(indexFile);

  if (!fallbackFile) {
    return null;
  }

  return {
    contentType: getContentType(fallbackFile),
    path: fallbackFile,
  };
}

async function getReadableFile(filePath: string): Promise<string | null> {
  try {
    const fileStat = await stat(filePath);

    return fileStat.isFile() ? filePath : null;
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return null;
    }

    throw error;
  }
}

function getContentType(filePath: string): string {
  return (
    contentTypes[extname(filePath).toLowerCase()] ??
    'application/octet-stream'
  );
}

function getRequestPathname(request: FastifyRequest): string {
  try {
    return new URL(request.url, 'http://localhost').pathname;
  } catch {
    return '/';
  }
}

function resolveSafePath(rootDir: string, pathname: string): string | null {
  let decodedPathname: string;

  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const normalizedPath = normalize(decodedPathname).replace(/^(\.\.[/\\])+/, '');
  const requestedFile = resolve(rootDir, `.${normalizedPath}`);

  if (requestedFile !== rootDir && !requestedFile.startsWith(`${rootDir}${sep}`)) {
    return null;
  }

  return requestedFile;
}

function sendRouteNotFound(
  request: FastifyRequest,
  reply: FastifyReply,
): FastifyReply {
  return reply.status(404).send({
    error: 'Not Found',
    message: `Route ${request.method}:${getRequestPathname(request)} not found`,
  });
}
