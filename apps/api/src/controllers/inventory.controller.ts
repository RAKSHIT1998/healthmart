import type { Request, Response } from 'express';
import { AuditAction, type PaginationQuery } from '@buymedicines/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendPaginated, buildPaginationMeta } from '../utils/apiResponse';
import * as inventoryService from '../services/inventory.service';
import { recordAudit } from '../middlewares/audit.middleware';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const listAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, total } = await inventoryService.listAll(req.query.branchId as string | undefined, page, limit);
  sendPaginated(res, items, buildPaginationMeta(total, page, limit));
});

export const listMovements = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, total } = await inventoryService.listMovements(
    {
      medicineId: req.query.medicineId as string | undefined,
      branchId: req.query.branchId as string | undefined,
      type: req.query.type as string | undefined,
    },
    page,
    limit,
  );
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

export const writeOffBatch = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const batch = await inventoryService.writeOffBatch({
    batchId: req.params.batchId as string,
    quantity: req.body.quantity,
    reason: req.body.reason,
    notes: req.body.notes,
    createdBy: req.user!.id,
  });
  recordAudit({ req, action: AuditAction.UPDATE, entityType: 'Batch', entityId: String(batch!._id), after: batch!.toJSON() });
  sendSuccess(res, batch, 'Batch written off');
});

export const updateLowStockThreshold = asyncHandler(async (req: Request, res: Response) => {
  const updated = await inventoryService.updateLowStockThreshold(
    req.params.medicineId as string,
    req.params.branchId as string,
    req.body.lowStockThreshold,
  );
  sendSuccess(res, updated, 'Low stock threshold updated');
});
