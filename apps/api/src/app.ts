import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors';
import { requestId as requestIdMiddleware } from './middleware/requestId';
import { httpLogger as pinoHttpMiddleware } from './middleware/logger';
import { securityMiddleware } from './middleware/security';
import { errorHandler as globalErrorHandler } from './middleware/errorHandler';
import { rateLimitMiddleware } from './middleware/abuse-prevention';
import { v1Router } from './api/v1/router';
import { logger } from './lib/pino';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

export function createApp() {
  const app = express();

  // ─── Global Middleware (order matters) ───────────────────
  app.use(requestIdMiddleware);
  app.use(pinoHttpMiddleware);
  app.use(securityMiddleware);
  app.use(rateLimitMiddleware);
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ─── Health Check ────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        service: 'peer-tutoring-api',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
      },
      error: null,
      meta: null,
    });
  });

  // ─── API Documentation ──────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Peer Tutoring API Docs',
    }));
    app.get('/api-docs.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
  }



  // ─── API Routes ──────────────────────────────────────────
  app.use('/api/v1', v1Router);

  // ─── 404 Handler ─────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      data: null,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
        details: null,
      },
      meta: null,
    });
  });

  // ─── Global Error Handler ───────────────────────────────
  app.use(globalErrorHandler);

  logger.info('Express app initialized');
  return app;
}
