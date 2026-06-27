import { Router } from 'express';
import { objectIdSchema } from '@healthmart/shared';
import { z } from 'zod';
import * as wishlistController from '../controllers/wishlist.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', wishlistController.get);
router.post('/:medicineId', validate({ params: z.object({ medicineId: objectIdSchema }) }), wishlistController.add);
router.delete('/:medicineId', validate({ params: z.object({ medicineId: objectIdSchema }) }), wishlistController.remove);

export default router;
