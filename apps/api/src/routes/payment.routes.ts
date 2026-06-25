import { Router } from 'express';
import express from 'express';
import { objectIdSchema } from '@healthmart/shared';
import { z } from 'zod';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { webhookRateLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

const captureRawBody = express.json({
  verify: (req, _res, buf) => {
    (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
  },
});

router.post('/cashfree/webhook', webhookRateLimiter, captureRawBody, paymentController.cashfreeWebhook);
router.get('/status/:orderId', authenticate, validate({ params: z.object({ orderId: objectIdSchema }) }), paymentController.checkStatus);

export default router;
