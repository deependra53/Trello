import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

// Logs one concise line per request: method, path, status, and time taken.
// e.g. `GET /api/chat/workspaces/.../dms 304 12ms`
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(0)}ms`);
  });
  next();
}
