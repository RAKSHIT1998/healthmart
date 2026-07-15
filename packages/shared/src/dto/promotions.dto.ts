import { z } from 'zod';
import { objectIdSchema } from './common.dto';

export const applyReferralCodeSchema = z.object({
  code: z.string().min(4).max(20),
});

export const issueGiftCardSchema = z.object({
  initialValue: z.number().positive().max(50000),
  issuedToEmail: z.string().email().optional(),
  issuedToPhone: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  notes: z.string().max(300).optional(),
});

export const redeemGiftCardSchema = z.object({
  code: z.string().min(6).max(24),
});

export const createFlashSaleSchema = z
  .object({
    name: z.string().min(2).max(120),
    bannerImage: z.string().url().optional(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    items: z
      .array(
        z.object({
          medicineId: objectIdSchema,
          flashPrice: z.number().positive(),
        }),
      )
      .min(1),
    isActive: z.boolean().default(true),
  })
  .refine((d) => new Date(d.endAt) > new Date(d.startAt), {
    message: 'endAt must be after startAt',
    path: ['endAt'],
  });

export const updateFlashSaleSchema = z.object({
  name: z.string().min(2).max(120),
  bannerImage: z.string().url(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  items: z.array(z.object({ medicineId: objectIdSchema, flashPrice: z.number().positive() })),
  isActive: z.boolean(),
}).partial();

export const sendEmailCampaignSchema = z
  .object({
    name: z.string().min(2).max(120),
    subject: z.string().min(3).max(160),
    previewText: z.string().max(200).optional(),
    headline: z.string().min(3).max(160),
    body: z.string().min(10).max(5000),
    ctaLabel: z.string().max(50).optional(),
    ctaUrl: z.string().url().optional(),
    audience: z.enum(['all', 'customers', 'staff']).default('customers'),
    sendToSubscribedOnly: z.boolean().default(true),
    testEmail: z.string().email().optional(),
  })
  .refine((data) => Boolean(data.ctaLabel) === Boolean(data.ctaUrl), {
    message: 'ctaLabel and ctaUrl must be provided together',
    path: ['ctaUrl'],
  });

export type ApplyReferralCodeInput = z.infer<typeof applyReferralCodeSchema>;
export type IssueGiftCardInput = z.infer<typeof issueGiftCardSchema>;
export type RedeemGiftCardInput = z.infer<typeof redeemGiftCardSchema>;
export type CreateFlashSaleInput = z.infer<typeof createFlashSaleSchema>;
export type UpdateFlashSaleInput = z.infer<typeof updateFlashSaleSchema>;
export type SendEmailCampaignInput = z.infer<typeof sendEmailCampaignSchema>;
