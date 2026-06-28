import { Router } from 'express';
import { Role, paginationQuerySchema } from '@healthmart/shared';
import { z } from 'zod';
import * as userController from '../controllers/user.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

const updateMeSchema = z
  .object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    avatarUrl: z.string().url(),
    notificationPreferences: z.object({ sms: z.boolean(), email: z.boolean(), push: z.boolean(), whatsapp: z.boolean() }).partial(),
  })
  .partial();

router.get('/me', userController.me);
router.patch('/me', validate({ body: updateMeSchema }), userController.updateMe);

router.get('/staff', requireRole(Role.ADMIN, Role.MANAGER), validate({ query: paginationQuerySchema }), userController.listStaff);
router.get('/customers', requireRole(Role.ADMIN, Role.MANAGER), validate({ query: paginationQuerySchema }), userController.listCustomers);
router.patch('/:id/deactivate', requireRole(Role.ADMIN), userController.deactivate);
router.patch('/:id/reactivate', requireRole(Role.ADMIN), userController.reactivate);

export default router;
