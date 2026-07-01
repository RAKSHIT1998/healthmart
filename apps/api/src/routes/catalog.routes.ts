import { Router } from 'express';
import {
  Role,
  createBranchSchema,
  createCategorySchema,
  createManufacturerSchema,
  createSupplierSchema,
  updateBranchSchema,
  updateCategorySchema,
} from '@buymedicines/shared';
import * as catalogController from '../controllers/catalog.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

router.get('/categories', catalogController.listCategories);
router.get('/manufacturers', catalogController.listManufacturers);
router.get('/suppliers', authenticate, requireRole(Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER), catalogController.listSuppliers);
router.get('/branches', catalogController.listBranches);

router.post(
  '/categories',
  authenticate,
  requireRole(Role.ADMIN, Role.MANAGER),
  validate({ body: createCategorySchema }),
  catalogController.createCategory,
);
router.patch(
  '/categories/:id',
  authenticate,
  requireRole(Role.ADMIN, Role.MANAGER),
  validate({ body: updateCategorySchema }),
  catalogController.updateCategory,
);
router.delete('/categories/:id', authenticate, requireRole(Role.ADMIN, Role.MANAGER), catalogController.deleteCategory);

router.post(
  '/manufacturers',
  authenticate,
  requireRole(Role.ADMIN, Role.MANAGER),
  validate({ body: createManufacturerSchema }),
  catalogController.createManufacturer,
);

router.post(
  '/suppliers',
  authenticate,
  requireRole(Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER),
  validate({ body: createSupplierSchema }),
  catalogController.createSupplier,
);

router.get('/branches/admin', authenticate, requireRole(Role.ADMIN, Role.MANAGER), catalogController.listBranchesAdmin);
router.post(
  '/branches',
  authenticate,
  requireRole(Role.ADMIN),
  validate({ body: createBranchSchema }),
  catalogController.createBranch,
);
router.patch(
  '/branches/:id',
  authenticate,
  requireRole(Role.ADMIN),
  validate({ body: updateBranchSchema }),
  catalogController.updateBranch,
);
router.delete('/branches/:id', authenticate, requireRole(Role.ADMIN), catalogController.deactivateBranch);

export default router;
