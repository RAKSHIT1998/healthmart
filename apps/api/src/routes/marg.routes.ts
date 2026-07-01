import { Router } from 'express';
import multer from 'multer';
import { Role, margWebhookEnvelopeSchema, paginationQuerySchema, triggerMargSyncSchema } from '@buymedicines/shared';
import * as margController from '../controllers/marg.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { verifyMargWebhookSignature } from '../middlewares/margWebhookAuth.middleware';
import { webhookRateLimiter } from '../middlewares/rateLimiter.middleware';
import { ApiError } from '../utils/ApiError';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/\.(csv|xlsx|xls)$/i.test(file.originalname)) {
      cb(ApiError.badRequest('Only .csv, .xlsx, or .xls files are allowed'));
      return;
    }
    cb(null, true);
  },
});

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
router.post('/upload', upload.single('file'), margController.uploadAndSync);
router.get('/logs', validate({ query: paginationQuerySchema }), margController.listLogs);

export default router;
