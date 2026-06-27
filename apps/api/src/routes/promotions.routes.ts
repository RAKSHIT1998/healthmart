import { Router } from 'express';
import {
  Role,
  applyReferralCodeSchema,
  createFlashSaleSchema,
  issueGiftCardSchema,
  objectIdSchema,
  redeemGiftCardSchema,
  updateFlashSaleSchema,
} from '@healthmart/shared';
import { z } from 'zod';
import * as promotionsController from '../controllers/promotions.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

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

export default router;
