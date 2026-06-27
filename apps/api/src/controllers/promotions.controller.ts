import type { Request, Response } from 'express';
import { AuditAction, type PaginationQuery } from '@healthmart/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPaginated, sendSuccess } from '../utils/apiResponse';
import * as promotionsService from '../services/promotions.service';
import { recordAudit } from '../middlewares/audit.middleware';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

// ---- Referral ----

export const getMyReferralCode = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const code = await promotionsService.getOrCreateReferralCode(req.user!.id);
  sendSuccess(res, { code });
});

export const applyReferralCode = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await promotionsService.applyReferralCode(req.user!.id, req.body.code);
  sendSuccess(res, null, 'Referral code applied');
});

// ---- Gift cards ----

export const issueGiftCard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const giftCard = await promotionsService.issueGiftCard(req.user!.id, req.body);
  recordAudit({ req, action: AuditAction.CREATE, entityType: 'GiftCard', entityId: String(giftCard._id) });
  sendSuccess(res, giftCard, 'Gift card issued', 201);
});

export const redeemGiftCard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await promotionsService.redeemGiftCard(req.user!.id, req.body.code);
  sendSuccess(res, result, 'Gift card redeemed');
});

export const listGiftCards = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, pagination } = await promotionsService.listGiftCards(page, limit);
  sendPaginated(res, items, pagination);
});

// ---- Flash sales ----

export const createFlashSale = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const flashSale = await promotionsService.createFlashSale(req.user!.id, req.body);
  recordAudit({ req, action: AuditAction.CREATE, entityType: 'FlashSale', entityId: String(flashSale._id) });
  sendSuccess(res, flashSale, 'Flash sale created', 201);
});

export const updateFlashSale = asyncHandler(async (req: Request, res: Response) => {
  const flashSale = await promotionsService.updateFlashSale(req.params.id as string, req.body);
  sendSuccess(res, flashSale, 'Flash sale updated');
});

export const listFlashSales = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await promotionsService.listFlashSales());
});

export const getActiveFlashSales = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await promotionsService.getActiveFlashSales());
});
