import { z } from 'zod';
import { objectIdSchema } from './common.dto';

export const receivePurchaseSchema = z.object({
  medicineId: objectIdSchema,
  branchId: objectIdSchema,
  batchNumber: z.string().min(1).max(60),
  expiryDate: z.string().datetime().or(z.string().date()),
  quantity: z.number().int().positive(),
  costPrice: z.number().nonnegative(),
  supplierId: objectIdSchema.optional(),
  rackNumber: z.string().max(30).optional(),
  warehouse: z.string().max(60).optional(),
});

export type ReceivePurchaseInput = z.infer<typeof receivePurchaseSchema>;
