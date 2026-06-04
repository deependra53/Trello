import winston from 'winston';
import { env } from './env.js';

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

// Concise dev line: `12:01:55 info: message {meta}` — meta only printed when present.
const devLine = printf(({ level, message, timestamp: ts, ...meta }) => {
  const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts as string} ${level}: ${message as string}${rest}`;
});

const base = winston.createLogger({
  level: env.LOG_LEVEL,
  format:
    env.NODE_ENV === 'development'
      ? combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), devLine)
      : combine(timestamp(), errors({ stack: true }), json()),
  transports: [new winston.transports.Console()],
});

// Pino-style facade: `logger.info(obj?, message)` / `logger.error(err, message)`,
// so existing call sites keep working without churn.
type Meta = Record<string, unknown>;
function adapt(level: 'info' | 'warn' | 'error' | 'debug') {
  return (arg1: unknown, arg2?: string): void => {
    if (typeof arg1 === 'string') {
      base.log(level, arg1);
    } else if (arg1 instanceof Error) {
      base.log(level, arg2 ?? arg1.message, { err: arg1.stack ?? arg1.message });
    } else {
      base.log(level, arg2 ?? '', (arg1 ?? {}) as Meta);
    }
  };
}

export const logger = {
  info: adapt('info'),
  warn: adapt('warn'),
  error: adapt('error'),
  debug: adapt('debug'),
};
