import { Router } from 'express';
import { Role } from '@healthmart/shared';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate, requireRole(Role.ADMIN, Role.MANAGER));

router.get('/dashboard', analyticsController.dashboard);
router.get('/top-medicines', analyticsController.topMedicines);
router.get('/sales-trend', analyticsController.salesTrend);
router.get('/inventory-alerts', analyticsController.inventoryAlerts);

export default router;
