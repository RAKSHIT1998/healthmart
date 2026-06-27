import { Router } from 'express';
import { Role, createCouponSchema, updateCouponSchema } from '@healthmart/shared';
import * as couponController from '../controllers/coupon.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

router.get('/', couponController.list);

router.use(authenticate, requireRole(Role.ADMIN, Role.MANAGER));
router.post('/', validate({ body: createCouponSchema }), couponController.create);
router.patch('/:id', validate({ body: updateCouponSchema }), couponController.update);
router.delete('/:id', couponController.remove);

export default router;
