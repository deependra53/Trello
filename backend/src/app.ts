import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()), credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  // pino-http v9 typings lag pino v9 — cast through unknown; runtime is fine.
  app.use(pinoHttp({ logger } as unknown as Parameters<typeof pinoHttp>[0]));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(err);
    res.status(500).json({ error: { code: 'INTERNAL', message: err.message } });
  });

  return app;
}
