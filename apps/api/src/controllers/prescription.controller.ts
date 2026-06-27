import type { Request, Response } from 'express';
import type { PaginationQuery } from '@healthmart/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPaginated, sendSuccess } from '../utils/apiResponse';
import * as prescriptionService from '../services/prescription.service';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const upload = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const prescription = await prescriptionService.uploadPrescription(req.user!.id, req.body.imageUrls, req.body.notes);
  sendSuccess(res, prescription, 'Prescription uploaded and queued for review', 201);
});

export const myPrescriptions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, pagination } = await prescriptionService.listMyPrescriptions(req.user!.id, page, limit);
  sendPaginated(res, items, pagination);
});

export const pendingReview = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, pagination } = await prescriptionService.listPendingPrescriptions(page, limit);
  sendPaginated(res, items, pagination);
});

export const review = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const prescription = await prescriptionService.reviewPrescription(req.params.id as string, req.user!.id, req.body);
  sendSuccess(res, prescription, 'Prescription reviewed');
});
