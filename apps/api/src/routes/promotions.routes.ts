import { Router } from 'express';
import {
  Role,
  applyReferralCodeSchema,
  createFlashSaleSchema,
  issueGiftCardSchema,
  objectIdSchema,
  paginationQuerySchema,
  redeemGiftCardSchema,
  updateFlashSaleSchema,
} from '@buymedicines/shared';
import { z } from 'zod';
import * as promotionsController from '../controllers/promotions.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();
const sendEmailCampaignSchema = z
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

// Public
router.get('/flash-sales/active', promotionsController.getActiveFlashSales);

// Customer (authenticated)
router.get('/referrals/my-code', authenticate, promotionsController.getMyReferralCode);
router.post('/referrals/apply', authenticate, validate({ body: applyReferralCodeSchema }), promotionsController.applyReferralCode);
router.post('/gift-cards/redeem', authenticate, validate({ body: redeemGiftCardSchema }), promotionsController.redeemGiftCard);

// Admin
router.post(
  '/gift-cards/issue',
  authenticate,
  requireRole(Role.ADMIN, Role.MANAGER),
  validate({ body: issueGiftCardSchema }),
  promotionsController.issueGiftCard,
);
router.get(
  '/gift-cards',
  authenticate,
  requireRole(Role.ADMIN, Role.MANAGER),
  validate({ query: paginationQuerySchema }),
  promotionsController.listGiftCards,
);
router.get('/flash-sales', authenticate, requireRole(Role.ADMIN, Role.MANAGER), promotionsController.listFlashSales);
router.post(
  '/flash-sales',
  authenticate,
  requireRole(Role.ADMIN, Role.MANAGER),
  validate({ body: createFlashSaleSchema }),
  promotionsController.createFlashSale,
);
router.patch(
  '/flash-sales/:id',
  authenticate,
  requireRole(Role.ADMIN, Role.MANAGER),
  validate({ params: z.object({ id: objectIdSchema }), body: updateFlashSaleSchema }),
  promotionsController.updateFlashSale,
);
router.get('/email-campaigns', authenticate, requireRole(Role.ADMIN, Role.MANAGER), promotionsController.listEmailCampaigns);
router.post(
  '/email-campaigns',
  authenticate,
  requireRole(Role.ADMIN, Role.MANAGER),
  validate({ body: sendEmailCampaignSchema }),
  promotionsController.sendEmailCampaign,
);

export default router;
