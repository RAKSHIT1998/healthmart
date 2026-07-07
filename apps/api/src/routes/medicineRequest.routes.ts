import { Router } from 'express';
import { Role, createMedicineRequestSchema, objectIdSchema, paginationQuerySchema, updateMedicineRequestStatusSchema } from '@buymedicines/shared';
import { z } from 'zod';
import * as medicineRequestController from '../controllers/medicineRequest.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

// Customer
router.post('/', validate({ body: createMedicineRequestSchema }), medicineRequestController.create);
router.get('/mine', validate({ query: paginationQuerySchema }), medicineRequestController.myRequests);

// Admin / Manager
const listQuerySchema = paginationQuerySchema.extend({ status: z.string().optional() });
router.get('/', requireRole(Role.ADMIN, Role.MANAGER), validate({ query: listQuerySchema }), medicineRequestController.listAll);
router.patch(
  '/:id/status',
  requireRole(Role.ADMIN, Role.MANAGER),
  validate({ params: z.object({ id: objectIdSchema }), body: updateMedicineRequestStatusSchema }),
  medicineRequestController.updateStatus,
);

export default router;
