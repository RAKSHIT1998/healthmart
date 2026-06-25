import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as catalogService from '../services/catalog.service';
import { AuditAction } from '@healthmart/shared';
import { recordAudit } from '../middlewares/audit.middleware';

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await catalogService.listCategories(req.query.group as string | undefined);
  sendSuccess(res, categories);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await catalogService.createCategory(req.body);
  recordAudit({ req, action: AuditAction.CREATE, entityType: 'Category', entityId: String(category._id), after: category.toJSON() });
  sendSuccess(res, category, 'Category created', 201);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await catalogService.updateCategory(req.params.id as string, req.body);
  recordAudit({ req, action: AuditAction.UPDATE, entityType: 'Category', entityId: req.params.id });
  sendSuccess(res, category, 'Category updated');
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await catalogService.deleteCategory(req.params.id as string);
  recordAudit({ req, action: AuditAction.DELETE, entityType: 'Category', entityId: req.params.id });
  sendSuccess(res, null, 'Category deactivated');
});

export const listManufacturers = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await catalogService.listManufacturers());
});

export const createManufacturer = asyncHandler(async (req: Request, res: Response) => {
  const manufacturer = await catalogService.createManufacturer(req.body);
  sendSuccess(res, manufacturer, 'Manufacturer created', 201);
});

export const listSuppliers = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await catalogService.listSuppliers());
});

export const createSupplier = asyncHandler(async (req: Request, res: Response) => {
  const supplier = await catalogService.createSupplier(req.body);
  sendSuccess(res, supplier, 'Supplier created', 201);
});

export const listBranches = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await catalogService.listBranches());
});
