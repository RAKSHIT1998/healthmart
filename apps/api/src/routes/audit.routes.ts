import { Router } from 'express';
import { Role, paginationQuerySchema } from '@healthmart/shared';
import * as auditController from '../controllers/audit.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate, requireRole(Role.ADMIN));
router.get('/', validate({ query: paginationQuerySchema }), auditController.list);

export default router;
