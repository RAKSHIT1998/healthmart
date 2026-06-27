import type { Request, Response } from 'express';
import { AuditAction, type PaginationQuery } from '@healthmart/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendPaginated, buildPaginationMeta } from '../utils/apiResponse';
import * as inventoryService from '../services/inventory.service';
import { recordAudit } from '../middlewares/audit.middleware';

export const listAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, total } = await inventoryService.listAll(req.query.branchId as string | undefined, page, limit);
  sendPaginated(res, items, buildPaginationMeta(total, page, limit));
});

export const receivePurchase = asyncHandler(async (req: Request, res: Response) => {
  const batch = await inventoryService.receivePurchase({
    ...req.body,
    expiryDate: new Date(req.body.expiryDate),
  });
  recordAudit({ req, action: AuditAction.CREATE, entityType: 'Batch', entityId: String(batch._id), after: batch.toJSON() });
  sendSuccess(res, batch, 'Stock received', 201);
});

export const lowStock = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await inventoryService.getLowStock(req.query.branchId as string | undefined));
});

export const expiringSoon = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(
    res,
    await inventoryService.getExpiringSoon(req.query.branchId as string | undefined, Number(req.query.days) || undefined),
  );
});

export const availability = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await inventoryService.getAvailability(req.params.medicineId as string, req.params.branchId as string));
});

export const inventoryValue = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, { value: await inventoryService.getInventoryValue(req.query.branchId as string | undefined) });
});
