import type { Response } from 'express';
import { AuditAction } from '@healthmart/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { recordAudit } from '../middlewares/audit.middleware';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import * as bulkUpdateService from '../services/bulkUpdate.service';

export const previewBulkUpdate = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const file = req.file;
  if (!file) throw ApiError.badRequest('No file uploaded');
  const branchId = req.body.branchId as string;
  if (!branchId) throw ApiError.badRequest('branchId is required');

  const rows = await bulkUpdateService.previewBulkUpdate(file.buffer, file.originalname, branchId);
  sendSuccess(res, rows, 'File parsed');
});

export const commitBulkUpdate = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { branchId, rows } = req.body;
  const result = await bulkUpdateService.commitBulkUpdate(rows, branchId, req.user!.id);
  recordAudit({
    req,
    action: AuditAction.UPDATE,
    entityType: 'BulkUpdate',
    after: { branchId, updated: result.updated, skipped: result.skipped, total: result.total },
  });
  sendSuccess(res, result, 'Bulk update applied');
});
