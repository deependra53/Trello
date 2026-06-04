import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { MulterError } from 'multer';
import { AppError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: { code: 'VALIDATION', message: 'Invalid input', details: err.flatten() },
    });
    return;
  }

  if (err instanceof AppError) {
    res
      .status(err.statusCode)
      .json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      error: { code: 'VALIDATION', message: err.message, details: err.errors },
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: { code: 'BAD_ID', message: 'Invalid identifier' } });
    return;
  }

  // Multipart upload errors (e.g. file too large) — surface as a clear 4xx
  // instead of a generic 500. Applies to avatar, card, and chat uploads.
  if (err instanceof MulterError) {
    const tooBig = err.code === 'LIMIT_FILE_SIZE';
    res.status(tooBig ? 413 : 400).json({
      error: {
        code: tooBig ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR',
        message: tooBig ? 'File is too large' : err.message,
      },
    });
    return;
  }

  // Duplicate key (e.g. unique email)
  if (
    err &&
    typeof err === 'object' &&
    'code' in err &&
    (err as { code: number }).code === 11000
  ) {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'Duplicate key' } });
    return;
  }

  logger.error(err, 'unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error' } });
}
