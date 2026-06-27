import type { Request, Response } from 'express';
import { AuditAction, type PaginationQuery } from '@healthmart/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPaginated, sendSuccess } from '../utils/apiResponse';
import * as userService from '../services/user.service';
import { recordAudit } from '../middlewares/audit.middleware';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const me = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, await userService.getUserProfile(req.user!.id));
});

export const updateMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, await userService.updateProfile(req.user!.id, req.body), 'Profile updated');
});

export const listStaff = asyncHandler(async (req: Request, res: Response) => {
  const pagination = req.query as unknown as PaginationQuery;
  const { items, pagination: meta } = await userService.listStaff(pagination);
  sendPaginated(res, items, meta);
});

export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const pagination = req.query as unknown as PaginationQuery;
  const { items, pagination: meta } = await userService.listCustomers(pagination, req.query.search as string | undefined);
  sendPaginated(res, items, meta);
});

export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.deactivateUser(req.params.id as string);
  recordAudit({ req, action: AuditAction.UPDATE, entityType: 'User', entityId: req.params.id, after: { isActive: false } });
  sendSuccess(res, user, 'User deactivated');
});

export const reactivate = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.reactivateUser(req.params.id as string);
  recordAudit({ req, action: AuditAction.UPDATE, entityType: 'User', entityId: req.params.id, after: { isActive: true } });
  sendSuccess(res, user, 'User reactivated');
});
