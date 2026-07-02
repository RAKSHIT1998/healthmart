import { Router } from 'express';
import multer from 'multer';
import { Role, createMedicineSchema, medicineSearchQuerySchema, objectIdSchema, updateMedicineSchema } from '@buymedicines/shared';
import { z } from 'zod';
import * as medicineController from '../controllers/medicine.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { ApiError } from '../utils/ApiError';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/\.(csv|xlsx|xls)$/i.test(file.originalname)) {
      cb(ApiError.badRequest('Only .csv, .xlsx, or .xls files are allowed'));
      return;
    }
    cb(null, true);
  },
});

router.get('/', validate({ query: medicineSearchQuerySchema }), medicineController.search);
router.get('/slug/:slug', medicineController.getBySlug);
router.get('/:id', validate({ params: z.object({ id: objectIdSchema }) }), medicineController.getById);

router.post(
  '/bulk-upload',
  authenticate,
  requireRole(Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER),
  upload.single('file'),
  medicineController.bulkUpload,
);
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
