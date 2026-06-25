import { Router } from 'express';
import { addCartItemSchema, applyCouponSchema, objectIdSchema, updateCartItemSchema } from '@healthmart/shared';
import { z } from 'zod';
import * as cartController from '../controllers/cart.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', validate({ body: addCartItemSchema }), cartController.addItem);
router.patch('/items/:medicineId', validate({ params: z.object({ medicineId: objectIdSchema }), body: updateCartItemSchema }), cartController.updateItem);
router.delete('/items/:medicineId', validate({ params: z.object({ medicineId: objectIdSchema }) }), cartController.removeItem);
router.post('/coupon', validate({ body: applyCouponSchema }), cartController.applyCoupon);
router.delete('/coupon', cartController.removeCoupon);
router.delete('/', cartController.clear);

export default router;
