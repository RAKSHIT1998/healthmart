import type { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as wishlistService from '../services/wishlist.service';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const get = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, await wishlistService.getWishlist(req.user!.id));
});

export const add = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, await wishlistService.addToWishlist(req.user!.id, req.params.medicineId as string), 'Added to wishlist');
});

export const remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, await wishlistService.removeFromWishlist(req.user!.id, req.params.medicineId as string), 'Removed from wishlist');
});
