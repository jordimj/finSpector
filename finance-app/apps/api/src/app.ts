import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { registerCategoryRoutes } from './routes/categories.js';
import { registerImportRoutes } from './routes/imports.js';
import { registerPaymentReminderRoutes } from './routes/payment-reminders.js';
import { registerReportRoutes } from './routes/reports.js';
import { registerTransactionRoutes } from './routes/transactions.js';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  });

  app.register(helmet);
  app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
  });
  app.register(sensible);

  app.get('/health', async () => ({
    status: 'ok',
  }));

  app.register(registerCategoryRoutes, { prefix: '/api/categories' });
  app.register(registerImportRoutes, { prefix: '/api/imports' });
  app.register(registerPaymentReminderRoutes, {
    prefix: '/api/payment-reminders',
  });
  app.register(registerTransactionRoutes, { prefix: '/api/transactions' });
  app.register(registerReportRoutes, { prefix: '/api/reports' });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error(error);

    if (error.validation) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: error.message,
      });
    }

    const statusCode = error.statusCode ?? 500;
    const message =
      statusCode >= 500 ? 'Unexpected server error' : error.message;

    return reply.status(statusCode).send({
      error: statusCode >= 500 ? 'Internal Server Error' : error.name,
      message,
    });
  });

  return app;
}
