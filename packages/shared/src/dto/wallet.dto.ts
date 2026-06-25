import { z } from 'zod';
import { objectIdSchema } from './common.dto';

export const adjustWalletSchema = z.object({
  userId: objectIdSchema,
  amount: z.number().positive(),
  type: z.enum(['credit', 'debit']),
  reason: z.enum(['refund', 'cashback', 'order_payment', 'admin_adjustment', 'referral']),
  remarks: z.string().max(300).optional(),
});

export type AdjustWalletInput = z.infer<typeof adjustWalletSchema>;
