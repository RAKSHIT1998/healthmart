import type { Request, Response } from 'express';
import { AuditAction, type MedicineSearchQuery } from '@buymedicines/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPaginated, sendSuccess } from '../utils/apiResponse';
import * as medicineService from '../services/medicine.service';
import { recordAudit } from '../middlewares/audit.middleware';

export const search = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as MedicineSearchQuery;
  const { items, pagination } = await medicineService.searchMedicines(query);
  sendPaginated(res, items, pagination);
});

export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const data = await medicineService.getMedicineBySlug(req.params.slug as string);
  sendSuccess(res, data);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const medicine = await medicineService.createMedicine(req.body);
  recordAudit({ req, action: AuditAction.CREATE, entityType: 'Medicine', entityId: String(medicine._id) });
  sendSuccess(res, medicine, 'Medicine created', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const medicine = await medicineService.updateMedicine(req.params.id as string, req.body);
  recordAudit({ req, action: AuditAction.UPDATE, entityType: 'Medicine', entityId: req.params.id });
  sendSuccess(res, medicine, 'Medicine updated');
});

export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  await medicineService.deactivateMedicine(req.params.id as string);
  recordAudit({ req, action: AuditAction.DELETE, entityType: 'Medicine', entityId: req.params.id });
  sendSuccess(res, null, 'Medicine deactivated');
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const medicine = await medicineService.getMedicineById(req.params.id as string);
  sendSuccess(res, medicine);
});
