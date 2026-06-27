import type { Request, Response } from 'express';
import { AuditAction, type PaginationQuery } from '@healthmart/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPaginated, sendSuccess } from '../utils/apiResponse';
import * as walletService from './../services/wallet.service';
import { recordAudit } from '../middlewares/audit.middleware';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const getWallet = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, await walletService.getWallet(req.user!.id));
});

export const listTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, pagination } = await walletService.listTransactions(req.user!.id, page, limit);
  sendPaginated(res, items, pagination);
});

export const adjustWallet = asyncHandler(async (req: Request, res: Response) => {
  const { userId, amount, type, reason, remarks } = req.body;
  const wallet =
    type === 'credit'
      ? await walletService.creditWallet(userId, amount, reason, undefined, remarks)
      : await walletService.debitWallet(userId, amount, reason, undefined, remarks);
  recordAudit({ req, action: AuditAction.UPDATE, entityType: 'Wallet', entityId: userId, after: { amount, type, reason } });
  sendSuccess(res, wallet, 'Wallet adjusted');
});
