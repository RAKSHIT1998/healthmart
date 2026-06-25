import { z } from 'zod';

export const createCouponSchema = z
  .object({
    code: z.string().min(3).max(40).toUpperCase(),
    description: z.string().max(200).optional(),
    type: z.enum(['flat', 'percentage', 'free_delivery']),
    value: z.number().min(0),
    maxDiscount: z.number().min(0).optional(),
    minOrderValue: z.number().min(0).default(0),
    usageLimitPerUser: z.number().int().min(1).default(1),
    totalUsageLimit: z.number().int().min(1).optional(),
    validFrom: z.string().datetime(),
    validTill: z.string().datetime(),
    isActive: z.boolean().default(true),
  })
  .refine((d) => new Date(d.validTill) > new Date(d.validFrom), {
    message: 'validTill must be after validFrom',
    path: ['validTill'],
  });

export const updateCouponSchema = z.object({
  description: z.string().max(200),
  value: z.number().min(0),
  maxDiscount: z.number().min(0),
  minOrderValue: z.number().min(0),
  usageLimitPerUser: z.number().int().min(1),
  totalUsageLimit: z.number().int().min(1),
  validFrom: z.string().datetime(),
  validTill: z.string().datetime(),
  isActive: z.boolean(),
}).partial();

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
