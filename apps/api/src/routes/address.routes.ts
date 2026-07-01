import { Router } from 'express';
import { addressSchema, objectIdSchema, updateAddressSchema } from '@buymedicines/shared';
import { z } from 'zod';
import * as addressController from '../controllers/address.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', addressController.list);
router.post('/', validate({ body: addressSchema }), addressController.create);
router.patch('/:id', validate({ params: z.object({ id: objectIdSchema }), body: updateAddressSchema }), addressController.update);
router.delete('/:id', validate({ params: z.object({ id: objectIdSchema }) }), addressController.remove);

export default router;
