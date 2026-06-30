import { Router } from 'express';
import {
  Role,
  bulkCreateServiceablePincodesSchema,
  cityPincodeLookupQuerySchema,
  createServiceablePincodeSchema,
  objectIdSchema,
  paginationQuerySchema,
  updateServiceablePincodeSchema,
} from '@healthmart/shared';
import { z } from 'zod';
import * as serviceabilityController from '../controllers/serviceability.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

// Public — the homepage/checkout pincode checker needs this before a customer logs in.
router.get('/check/:pincode', validate({ params: z.object({ pincode: z.string() }) }), serviceabilityController.check);

router.use(authenticate, requireRole(Role.ADMIN, Role.MANAGER));
router.get('/', validate({ query: paginationQuerySchema }), serviceabilityController.list);
router.post('/', validate({ body: createServiceablePincodeSchema }), serviceabilityController.create);
router.get('/lookup-city', validate({ query: cityPincodeLookupQuerySchema }), serviceabilityController.lookupCity);
router.post('/bulk', validate({ body: bulkCreateServiceablePincodesSchema }), serviceabilityController.bulkCreate);
router.patch('/:id', validate({ params: z.object({ id: objectIdSchema }), body: updateServiceablePincodeSchema }), serviceabilityController.update);
router.delete('/:id', validate({ params: z.object({ id: objectIdSchema }) }), serviceabilityController.remove);

export default router;
