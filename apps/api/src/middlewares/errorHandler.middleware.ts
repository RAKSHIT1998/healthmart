import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger';
import { isProduction } from '../config/env';
import { ApiError } from '../utils/ApiError';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.originalUrl }, err.message);
    }
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  if (err instanceof Error && err.name === 'CastError') {
    res.status(400).json({ success: false, message: 'Invalid identifier supplied', code: 'BAD_REQUEST' });
    return;
  }

  if (err instanceof Error && err.name === 'MongoServerError' && (err as { code?: number }).code === 11000) {
    res.status(409).json({ success: false, message: 'Duplicate value violates a unique constraint', code: 'CONFLICT' });
    return;
  }

  logger.error({ err, path: req.originalUrl }, 'Unhandled error');
  res.status(500).json({
    success: false,
    message: isProduction ? 'Internal server error' : (err as Error)?.message || 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}
