import { Router } from 'express';
import { Role, adjustWalletSchema, paginationQuerySchema } from '@healthmart/shared';
import * as walletController from '../controllers/wallet.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

router.get('/', walletController.getWallet);
router.get('/transactions', validate({ query: paginationQuerySchema }), walletController.listTransactions);
router.post('/adjust', requireRole(Role.ADMIN, Role.MANAGER), validate({ body: adjustWalletSchema }), walletController.adjustWallet);

export default router;
