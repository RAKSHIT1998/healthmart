import type { Request, Response } from 'express';
import {
  AuditAction,
  type CreateServiceablePincodeInput,
  type PaginationQuery,
  type UpdateServiceablePincodeInput,
} from '@healthmart/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPaginated, sendSuccess } from '../utils/apiResponse';
import * as serviceabilityService from '../services/serviceability.service';
import { recordAudit } from '../middlewares/audit.middleware';

export const check = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await serviceabilityService.checkServiceability(req.params.pincode as string));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateServiceablePincodeInput;
  const entry = await serviceabilityService.createServiceablePincode(input);
  recordAudit({ req, action: AuditAction.CREATE, entityType: 'ServiceablePincode', entityId: String(entry._id) });
  sendSuccess(res, entry, 'Pincode added', 201);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, pagination } = await serviceabilityService.listServiceablePincodes(page, limit);
  sendPaginated(res, items, pagination);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateServiceablePincodeInput;
  const entry = await serviceabilityService.updateServiceablePincode(req.params.id as string, input);
  recordAudit({ req, action: AuditAction.UPDATE, entityType: 'ServiceablePincode', entityId: req.params.id as string });
  sendSuccess(res, entry, 'Updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await serviceabilityService.deleteServiceablePincode(req.params.id as string);
  recordAudit({ req, action: AuditAction.DELETE, entityType: 'ServiceablePincode', entityId: req.params.id as string });
  sendSuccess(res, null, 'Removed');
});
