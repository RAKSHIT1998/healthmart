import type { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as cartService from '../services/cart.service';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const getCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, await cartService.getCart(req.user!.id));
});

export const addItem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, await cartService.addItemToCart(req.user!.id, req.body), 'Item added to cart');
});

export const updateItem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { medicineId } = req.params;
  const variantLabel = req.query.variantLabel as string | undefined;
  sendSuccess(res, await cartService.updateCartItem(req.user!.id, medicineId as string, variantLabel, req.body), 'Cart updated');
});

export const removeItem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { medicineId } = req.params;
  const variantLabel = req.query.variantLabel as string | undefined;
  sendSuccess(res, await cartService.removeCartItem(req.user!.id, medicineId as string, variantLabel), 'Item removed');
});

export const applyCoupon = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, await cartService.applyCouponToCart(req.user!.id, req.body.code), 'Coupon applied');
});

export const removeCoupon = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, await cartService.removeCouponFromCart(req.user!.id), 'Coupon removed');
});

export const clear = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await cartService.clearCart(req.user!.id);
  sendSuccess(res, null, 'Cart cleared');
});
