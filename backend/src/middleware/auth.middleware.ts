import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type AccessTokenPayload } from '../services/token.service.js';
import { Unauthorized } from '../utils/errors.js';

export interface AuthedRequest extends Request {
  user: AccessTokenPayload;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    next(Unauthorized('Missing or malformed Authorization header'));
    return;
  }
  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    (req as AuthedRequest).user = payload;
    next();
  } catch {
    next(Unauthorized('Invalid or expired access token'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) return next();
  try {
    const payload = verifyAccessToken(header.slice(7));
    (req as AuthedRequest).user = payload;
  } catch {
    // ignore
  }
  next();
}
