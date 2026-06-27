import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as analyticsService from '../services/analytics.service';

export const dashboard = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await analyticsService.getDashboardMetrics(req.query.branchId as string | undefined));
});

export const topMedicines = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await analyticsService.getTopMedicines(Number(req.query.limit) || 10));
});

export const salesTrend = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await analyticsService.getSalesTrend(Number(req.query.days) || 30, req.query.branchId as string | undefined));
});

export const inventoryAlerts = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await analyticsService.getInventoryAlerts(req.query.branchId as string | undefined));
});
