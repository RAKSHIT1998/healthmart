import { Router } from 'express';
import {
  Role,
  createReturnRequestSchema,
  objectIdSchema,
  paginationQuerySchema,
  processReturnRequestSchema,
} from '@healthmart/shared';
import { z } from 'zod';
import * as returnController from '../controllers/return.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

// Customer
router.post('/', validate({ body: createReturnRequestSchema }), returnController.create);
router.get('/mine', validate({ query: paginationQuerySchema }), returnController.myReturns);

// Admin / Manager / Pharmacist review queue
const listQuerySchema = paginationQuerySchema.extend({ status: z.string().optional() });
router.get('/pending', requireRole(Role.ADMIN, Role.MANAGER, Role.PHARMACIST), validate({ query: paginationQuerySchema }), returnController.pending);
router.get('/', requireRole(Role.ADMIN, Role.MANAGER, Role.PHARMACIST), validate({ query: listQuerySchema }), returnController.listAll);
router.patch(
  '/:id/process',
  requireRole(Role.ADMIN, Role.MANAGER, Role.PHARMACIST),
  validate({ params: z.object({ id: objectIdSchema }), body: processReturnRequestSchema }),
  returnController.process,
);

export default router;
