import type { Request, Response } from 'express';
import { AuditAction } from '@buymedicines/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as couponService from '../services/coupon.service';
import { recordAudit } from '../middlewares/audit.middleware';

export const list = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await couponService.listCoupons(req.query.activeOnly === 'true'));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponService.createCoupon(req.body);
  recordAudit({ req, action: AuditAction.CREATE, entityType: 'Coupon', entityId: String(coupon._id) });
  sendSuccess(res, coupon, 'Coupon created', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponService.updateCoupon(req.params.id as string, req.body);
  recordAudit({ req, action: AuditAction.UPDATE, entityType: 'Coupon', entityId: req.params.id });
  sendSuccess(res, coupon, 'Coupon updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await couponService.deleteCoupon(req.params.id as string);
  recordAudit({ req, action: AuditAction.DELETE, entityType: 'Coupon', entityId: req.params.id });
  sendSuccess(res, null, 'Coupon deactivated');
});
