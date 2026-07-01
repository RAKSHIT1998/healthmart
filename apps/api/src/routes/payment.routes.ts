import { Router } from 'express';
import { objectIdSchema } from '@buymedicines/shared';
import { z } from 'zod';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { webhookRateLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

router.post('/cashfree/webhook', webhookRateLimiter, paymentController.cashfreeWebhook);
router.get('/status/:orderId', authenticate, validate({ params: z.object({ orderId: objectIdSchema }) }), paymentController.checkStatus);

export default router;
