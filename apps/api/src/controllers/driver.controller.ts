import type { Request, Response } from 'express';
import type { PaginationQuery } from '@buymedicines/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPaginated, sendSuccess } from '../utils/apiResponse';
import * as driverService from '../services/driver.service';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const driver = await driverService.createDriver(req.body);
  sendSuccess(res, driver, 'Driver registered', 201);
});

export const listAvailable = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await driverService.listAvailableDrivers(req.params.branchId as string));
});

export const listByBranch = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await driverService.listDriversByBranch(req.params.branchId as string));
});

export const updateAvailability = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, await driverService.updateAvailability(req.user!.id, req.body.isAvailable), 'Availability updated');
});

export const updateLocation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, await driverService.updateLocation(req.user!.id, req.body.lat, req.body.lng), 'Location updated');
});

export const myAssignedOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, pagination } = await driverService.getAssignedOrders(req.user!.id, page, limit);
  sendPaginated(res, items, pagination);
});
