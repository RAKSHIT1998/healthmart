import type { Request, Response } from 'express';
import type { PaginationQuery } from '@buymedicines/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPaginated, sendSuccess } from '../utils/apiResponse';
import * as reviewService from '../services/review.service';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const listForMedicine = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, pagination } = await reviewService.listReviewsForMedicine(req.params.medicineId as string, page, limit);
  sendPaginated(res, items, pagination);
});

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const review = await reviewService.createReview(req.user!.id, req.body);
  sendSuccess(res, review, 'Review submitted', 201);
});

export const moderate = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.moderateReview(req.params.id as string, req.body.isApproved);
  sendSuccess(res, review, 'Review moderated');
});
