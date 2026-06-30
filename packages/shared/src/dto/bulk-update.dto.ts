import { z } from 'zod';
import { objectIdSchema } from './common.dto';
import { REGEX } from '../constants';

export const bulkUpdateRowSchema = z
  .object({
    medicineId: objectIdSchema,
    name: z.string().min(2).max(200).optional(),
    mrp: z.number().positive().optional(),
    sellingPrice: z.number().positive().optional(),
    gstPercentage: z.number().min(0).max(28).optional(),
    hsnCode: z.string().regex(REGEX.HSN).optional(),
    packSize: z.string().min(1).max(40).optional(),
    isActive: z.boolean().optional(),
    stockQuantity: z.number().int().nonnegative().optional(),
  })
  .refine((data) => data.mrp === undefined || data.sellingPrice === undefined || data.sellingPrice <= data.mrp, {
    message: 'Selling price cannot exceed MRP',
    path: ['sellingPrice'],
  });

export const commitBulkUpdateSchema = z.object({
  branchId: objectIdSchema,
  rows: z.array(bulkUpdateRowSchema).min(1).max(1000),
});

export type BulkUpdateRowInput = z.infer<typeof bulkUpdateRowSchema>;
export type CommitBulkUpdateInput = z.infer<typeof commitBulkUpdateSchema>;
