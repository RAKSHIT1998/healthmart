import { Router } from 'express';
import { Role, createReviewSchema, moderateReviewSchema, objectIdSchema, paginationQuerySchema } from '@buymedicines/shared';
import { z } from 'zod';
import * as reviewController from '../controllers/review.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

router.get('/medicine/:medicineId', validate({ params: z.object({ medicineId: objectIdSchema }), query: paginationQuerySchema }), reviewController.listForMedicine);
router.post('/', authenticate, validate({ body: createReviewSchema }), reviewController.create);
router.patch('/:id/moderate', authenticate, requireRole(Role.ADMIN, Role.MANAGER), validate({ body: moderateReviewSchema }), reviewController.moderate);

export default router;
