import { z } from 'zod';
import { objectIdSchema } from './common.dto';

export const checkoutSchema = z.object({
  addressId: objectIdSchema,
  deliverySlot: z.object({
    type: z.enum(['standard', 'express', 'scheduled']),
    date: z.string().datetime().optional(),
    windowStart: z.string().optional(),
    windowEnd: z.string().optional(),
  }),
  paymentMethod: z.enum(['cashfree', 'cod', 'wallet']),
  prescriptionIds: z.array(objectIdSchema).default([]),
  couponCode: z.string().optional(),
  useWalletBalance: z.boolean().default(false),
  notes: z.string().max(300).optional(),
});

export const cashfreeWebhookSchema = z.object({
  type: z.string(),
  data: z.record(z.string(), z.unknown()),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
