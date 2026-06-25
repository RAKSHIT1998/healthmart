import { z } from 'zod';
import { objectIdSchema } from './common.dto';

export const addCartItemSchema = z.object({
  medicineId: objectIdSchema,
  variantLabel: z.string().max(60).optional(),
  quantity: z.number().int().min(1).max(50),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(50),
});

export const applyCouponSchema = z.object({
  code: z.string().min(3).max(40),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
