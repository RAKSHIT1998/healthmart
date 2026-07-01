import { Router } from 'express';
import path from 'path';
import multer from 'multer';
import {
  Role,
  objectIdSchema,
  paginationQuerySchema,
  receivePurchaseSchema,
  writeOffBatchSchema,
  updateLowStockThresholdSchema,
  commitBulkUpdateSchema,
} from '@buymedicines/shared';
import { z } from 'zod';
import * as inventoryController from '../controllers/inventory.controller';
import * as bulkUpdateController from '../controllers/bulkUpdate.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { ApiError } from '../utils/ApiError';

const router = Router();

router.use(authenticate, requireRole(Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER));

const BULK_UPDATE_EXTENSIONS = new Set(['.xlsx', '.xls', '.csv', '.txt', '.pdf']);
const bulkUpdateUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!BULK_UPDATE_EXTENSIONS.has(path.extname(file.originalname).toLowerCase())) {
      cb(ApiError.badRequest('Only .xlsx, .xls, .csv, .txt, or .pdf files are allowed'));
      return;
    }
    cb(null, true);
  },
});

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
router.post('/bulk-update/preview', bulkUpdateUpload.single('file'), bulkUpdateController.previewBulkUpdate);
router.post(
  '/bulk-update/commit',
  validate({ body: commitBulkUpdateSchema }),
  bulkUpdateController.commitBulkUpdate,
);

export default router;
