import type { Request, Response } from 'express';
import {
  AuditAction,
  type CreateReturnRequestInput,
  type PaginationQuery,
  type ProcessReturnRequestInput,
} from '@healthmart/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPaginated, sendSuccess } from '../utils/apiResponse';
import * as returnService from '../services/return.service';
import { recordAudit } from '../middlewares/audit.middleware';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const input = req.body as CreateReturnRequestInput;
  const returnRequest = await returnService.createReturnRequest(req.user!.id, input);
  recordAudit({ req, action: AuditAction.CREATE, entityType: 'ReturnRequest', entityId: String(returnRequest._id) });
  sendSuccess(res, returnRequest, 'Return request submitted', 201);
});

export const myReturns = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, pagination } = await returnService.listMyReturns(req.user!.id, page, limit);
  sendPaginated(res, items, pagination);
});

export const pending = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, pagination } = await returnService.listPendingReturns(page, limit);
  sendPaginated(res, items, pagination);
});

export const listAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, pagination } = await returnService.listAllReturns(req.query.status as string | undefined, page, limit);
  sendPaginated(res, items, pagination);
});

export const process = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const input = req.body as ProcessReturnRequestInput;
  const returnRequest =
    input.action === 'approve'
      ? await returnService.approveReturn(req.params.id as string, req.user!.id, input.refundMethod)
      : await returnService.rejectReturn(req.params.id as string, req.user!.id, input.rejectionReason);

  recordAudit({
    req,
    action: AuditAction.STATUS_CHANGE,
    entityType: 'ReturnRequest',
    entityId: req.params.id as string,
    after: { status: returnRequest.status },
  });
  sendSuccess(res, returnRequest, input.action === 'approve' ? 'Return request approved' : 'Return request rejected');
});
