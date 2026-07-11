import { Router } from 'express';
import {
  Role,
  assignDriverSchema,
  cancelOrderSchema,
  checkoutSchema,
  deliveryOtpVerifySchema,
  objectIdSchema,
  updateOrderStatusSchema,
} from '@buymedicines/shared';
import { z } from 'zod';
import * as orderController from '../controllers/order.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

// Customer
router.post('/checkout', validate({ body: checkoutSchema }), orderController.checkout);
router.get('/', orderController.myOrders);
router.get('/:id', validate({ params: z.object({ id: objectIdSchema }) }), orderController.getOrder);
router.get('/:id/track', validate({ params: z.object({ id: objectIdSchema }) }), orderController.trackOrder);
router.get('/:id/invoice', validate({ params: z.object({ id: objectIdSchema }) }), orderController.getInvoice);
router.post('/:id/cancel', validate({ params: z.object({ id: objectIdSchema }), body: cancelOrderSchema }), orderController.cancelOrder);

// Admin / Manager / Pharmacist
router.get('/admin/all', requireRole(Role.ADMIN, Role.MANAGER, Role.PHARMACIST), orderController.listAllOrders);
router.get(
  '/admin/:id',
  requireRole(Role.ADMIN, Role.MANAGER, Role.PHARMACIST, Role.DELIVERY_BOY),
  validate({ params: z.object({ id: objectIdSchema }) }),
  orderController.getOrderAdmin,
);
router.patch(
  '/admin/:id/status',
  requireRole(Role.ADMIN, Role.MANAGER, Role.PHARMACIST, Role.INVENTORY_MANAGER),
  validate({ params: z.object({ id: objectIdSchema }), body: updateOrderStatusSchema }),
  orderController.updateStatus,
);
router.patch(
  '/admin/:id/assign-driver',
  requireRole(Role.ADMIN, Role.MANAGER, Role.PHARMACIST),
  validate({ params: z.object({ id: objectIdSchema }), body: assignDriverSchema }),
  orderController.assignDriver,
);

// Delivery boy
router.post(
  '/:id/delivery-otp/verify',
  requireRole(Role.DELIVERY_BOY, Role.ADMIN),
  validate({ params: z.object({ id: objectIdSchema }), body: deliveryOtpVerifySchema }),
  orderController.verifyDeliveryOtp,
);
router.post(
  '/:id/delivery-otp/resend',
  requireRole(Role.DELIVERY_BOY, Role.ADMIN),
  validate({ params: z.object({ id: objectIdSchema }) }),
  orderController.resendDeliveryOtp,
);

export default router;
