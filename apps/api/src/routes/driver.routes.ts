import { Router } from 'express';
import { Role, createDriverSchema, paginationQuerySchema, updateDriverAvailabilitySchema, updateDriverLocationSchema } from '@buymedicines/shared';
import * as driverController from '../controllers/driver.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

router.post('/', requireRole(Role.ADMIN, Role.MANAGER), validate({ body: createDriverSchema }), driverController.create);
router.get('/available/:branchId', requireRole(Role.ADMIN, Role.MANAGER), driverController.listAvailable);
router.get('/branch/:branchId', requireRole(Role.ADMIN, Role.MANAGER), driverController.listByBranch);

router.patch('/me/availability', requireRole(Role.DELIVERY_BOY), validate({ body: updateDriverAvailabilitySchema }), driverController.updateAvailability);
router.patch('/me/location', requireRole(Role.DELIVERY_BOY), validate({ body: updateDriverLocationSchema }), driverController.updateLocation);
router.get('/me/orders', requireRole(Role.DELIVERY_BOY), validate({ query: paginationQuerySchema }), driverController.myAssignedOrders);

export default router;
