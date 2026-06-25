import { z } from 'zod';
import { objectIdSchema } from './common.dto';

export const createReviewSchema = z.object({
  medicineId: objectIdSchema,
  orderId: objectIdSchema.optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().max(1000).optional(),
  images: z.array(z.string().url()).max(5).default([]),
});

export const moderateReviewSchema = z.object({
  isApproved: z.boolean(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
