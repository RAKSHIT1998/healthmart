import { Router } from 'express';
import { Role } from '@buymedicines/shared';
import * as reportController from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate, requireRole(Role.ADMIN, Role.MANAGER));

router.get('/sales', reportController.sales);
router.get('/gst', reportController.gst);
router.get('/stock', reportController.stock);
router.get('/expiry', reportController.expiry);

export default router;
