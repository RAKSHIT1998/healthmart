import { Router } from 'express';
import {
  Role,
  objectIdSchema,
  paginationQuerySchema,
  receivePurchaseSchema,
  writeOffBatchSchema,
  updateLowStockThresholdSchema,
} from '@healthmart/shared';
import { z } from 'zod';
import * as inventoryController from '../controllers/inventory.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate, requireRole(Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER));

const listQuerySchema = paginationQuerySchema.extend({ branchId: objectIdSchema.optional() });
const movementsQuerySchema = paginationQuerySchema.extend({
  branchId: objectIdSchema.optional(),
  medicineId: objectIdSchema.optional(),
  type: z.string().optional(),
});

router.get('/', validate({ query: listQuerySchema }), inventoryController.listAll);
router.get('/movements', validate({ query: movementsQuerySchema }), inventoryController.listMovements);
router.post('/purchases', validate({ body: receivePurchaseSchema }), inventoryController.receivePurchase);
router.get('/low-stock', inventoryController.lowStock);
router.get('/expiring-soon', inventoryController.expiringSoon);
router.get('/value', inventoryController.inventoryValue);
router.get(
  '/:medicineId/:branchId/availability',
  validate({ params: z.object({ medicineId: objectIdSchema, branchId: objectIdSchema }) }),
  inventoryController.availability,
);
router.post(
  '/batches/:batchId/write-off',
  validate({ params: z.object({ batchId: objectIdSchema }), body: writeOffBatchSchema }),
  inventoryController.writeOffBatch,
);
router.patch(
  '/:medicineId/:branchId/low-stock-threshold',
  validate({
    params: z.object({ medicineId: objectIdSchema, branchId: objectIdSchema }),
    body: updateLowStockThresholdSchema,
  }),
  inventoryController.updateLowStockThreshold,
);

export default router;
