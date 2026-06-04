import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

// Disable rate limiting outside production (dev/test) — keeps the protection in
// prod while staying out of the way locally.
const skip = () => env.NODE_ENV !== 'production';

export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many auth attempts' } },
});
