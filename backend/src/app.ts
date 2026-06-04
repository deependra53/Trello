import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.middleware.js';
import { generalLimiter } from './middleware/rateLimit.middleware.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import apiRoutes from './routes/index.js';
import { LOCAL_UPLOADS_DIR } from './uploads/providers.js';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  // `*` in the cors package's array form doesn't mean "any origin" — use `true`
  // (reflect the request origin) so direct browser→backend calls (e.g. uploads) pass.
  const corsOrigins = env.CORS_ORIGIN.split(',').map((s) => s.trim());
  app.use(cors({ origin: corsOrigins.includes('*') ? true : corsOrigins, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/uploads', express.static(LOCAL_UPLOADS_DIR));
  app.use('/api', generalLimiter, apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
