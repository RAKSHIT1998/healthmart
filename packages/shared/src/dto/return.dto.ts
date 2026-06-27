import { z } from 'zod';
import { objectIdSchema } from './common.dto';
import { RefundMethod, ReturnReasonCategory } from '../enums/order.enum';

export const createReturnRequestSchema = z.object({
  orderId: objectIdSchema,
  items: z
    .array(
      z.object({
        medicineId: objectIdSchema,
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
  reasonCategory: z.nativeEnum(ReturnReasonCategory),
  reason: z.string().max(300).optional(),
});

export const processReturnRequestSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().max(300).optional(),
  refundMethod: z.nativeEnum(RefundMethod).default(RefundMethod.WALLET),
});

export type CreateReturnRequestInput = z.infer<typeof createReturnRequestSchema>;
export type ProcessReturnRequestInput = z.infer<typeof processReturnRequestSchema>;
