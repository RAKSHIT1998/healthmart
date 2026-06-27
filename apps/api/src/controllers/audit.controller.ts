import type { Request, Response } from 'express';
import type { PaginationQuery } from '@healthmart/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPaginated } from '../utils/apiResponse';
import { AuditLogModel } from '../models';
import { buildPaginationMeta } from '../utils/apiResponse';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const filter: Record<string, unknown> = {};
  if (req.query.entityType) filter.entityType = req.query.entityType;
  if (req.query.actorId) filter.actorId = req.query.actorId;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    AuditLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('actorId', 'name email role'),
    AuditLogModel.countDocuments(filter),
  ]);

  sendPaginated(res, items, buildPaginationMeta(total, page, limit));
});
