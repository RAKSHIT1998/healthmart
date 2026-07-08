import { z } from 'zod';
import { objectIdSchema } from './common.dto';

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'pending_payment',
    'placed',
    'accepted',
    'rejected',
    'packed',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'returned',
  ]),
  reason: z.string().max(300).optional(),
});

export const assignDriverSchema = z.object({
  driverId: objectIdSchema,
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(3).max(300),
});

export const deliveryOtpVerifySchema = z.object({
  otp: z.string().length(6),
  proofOfDeliveryUrl: z.string().url().optional(),
  customerSignatureUrl: z.string().url().optional(),
  prescriptionVerified: z.boolean().optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type AssignDriverInput = z.infer<typeof assignDriverSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
