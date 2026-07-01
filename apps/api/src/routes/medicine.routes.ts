import { Router } from 'express';
import { Role, createMedicineSchema, medicineSearchQuerySchema, objectIdSchema, updateMedicineSchema } from '@buymedicines/shared';
import { z } from 'zod';
import * as medicineController from '../controllers/medicine.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

router.get('/', validate({ query: medicineSearchQuerySchema }), medicineController.search);
router.get('/slug/:slug', medicineController.getBySlug);
router.get('/:id', validate({ params: z.object({ id: objectIdSchema }) }), medicineController.getById);

router.post(
  '/',
  authenticate,
  requireRole(Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER),
  validate({ body: createMedicineSchema }),
  medicineController.create,
);
router.patch(
  '/:id',
  authenticate,
  requireRole(Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER),
  validate({ params: z.object({ id: objectIdSchema }), body: updateMedicineSchema }),
  medicineController.update,
);
router.delete(
  '/:id',
  authenticate,
  requireRole(Role.ADMIN, Role.MANAGER),
  validate({ params: z.object({ id: objectIdSchema }) }),
  medicineController.deactivate,
);

export default router;
