import type { Request, Response } from 'express';
import {
  AuditAction,
  type CreateMedicineRequestInput,
  type PaginationQuery,
  type UpdateMedicineRequestStatusInput,
} from '@buymedicines/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPaginated, sendSuccess } from '../utils/apiResponse';
import * as medicineRequestService from '../services/medicineRequest.service';
import { recordAudit } from '../middlewares/audit.middleware';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const input = req.body as CreateMedicineRequestInput;
  const request = await medicineRequestService.createMedicineRequest(req.user!.id, input);
  sendSuccess(res, request, "Thanks! We'll look into sourcing this and let you know.", 201);
});

export const myRequests = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, pagination } = await medicineRequestService.listMyMedicineRequests(req.user!.id, page, limit);
  sendPaginated(res, items, pagination);
});

export const listAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, pagination } = await medicineRequestService.listAllMedicineRequests(
    req.query.status as string | undefined,
    page,
    limit,
  );
  sendPaginated(res, items, pagination);
});

export const updateStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { status, adminNotes } = req.body as UpdateMedicineRequestStatusInput;
  const request = await medicineRequestService.updateMedicineRequestStatus(req.params.id as string, status, adminNotes);

  recordAudit({
    req,
    action: AuditAction.STATUS_CHANGE,
    entityType: 'MedicineRequest',
    entityId: req.params.id as string,
    after: { status: request.status },
  });
  sendSuccess(res, request, 'Request updated');
});
