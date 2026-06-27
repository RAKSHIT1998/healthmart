import { Router } from 'express';
import { Role, margWebhookEnvelopeSchema, paginationQuerySchema, triggerMargSyncSchema } from '@healthmart/shared';
import * as margController from '../controllers/marg.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { verifyMargWebhookSignature } from '../middlewares/margWebhookAuth.middleware';
import { webhookRateLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

router.post(
  '/webhook',
  webhookRateLimiter,
  verifyMargWebhookSignature,
  validate({ body: margWebhookEnvelopeSchema }),
  margController.webhook,
);

router.use(authenticate, requireRole(Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER));
router.post('/sync', validate({ body: triggerMargSyncSchema }), margController.triggerSync);
router.get('/logs', validate({ query: paginationQuerySchema }), margController.listLogs);

export default router;
