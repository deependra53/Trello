export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const BadRequest = (message: string, details?: unknown) =>
  new AppError(400, 'BAD_REQUEST', message, details);

export const Unauthorized = (message = 'Unauthorized') =>
  new AppError(401, 'UNAUTHORIZED', message);

export const Forbidden = (message = 'Forbidden') => new AppError(403, 'FORBIDDEN', message);

export const NotFound = (message = 'Not found') => new AppError(404, 'NOT_FOUND', message);

export const Conflict = (message: string) => new AppError(409, 'CONFLICT', message);

export const TooMany = (message = 'Too many requests') =>
  new AppError(429, 'RATE_LIMITED', message);
