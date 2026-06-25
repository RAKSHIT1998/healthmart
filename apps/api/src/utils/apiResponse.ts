import type { Response } from 'express';
import type { PaginationMeta } from '@healthmart/shared';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: Record<string, unknown>,
): Response {
  return res.status(statusCode).json({ success: true, message, data, ...(meta ? { meta } : {}) });
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  pagination: PaginationMeta,
  message = 'Success',
): Response {
  return res.status(200).json({ success: true, message, data: items, meta: { pagination } });
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
