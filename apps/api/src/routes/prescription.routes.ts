import { Router } from 'express';
import { Role, paginationQuerySchema, reviewPrescriptionSchema, uploadPrescriptionSchema } from '@healthmart/shared';
import * as prescriptionController from '../controllers/prescription.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

router.post('/', validate({ body: uploadPrescriptionSchema }), prescriptionController.upload);
router.get('/mine', validate({ query: paginationQuerySchema }), prescriptionController.myPrescriptions);

router.get('/pending', requireRole(Role.PHARMACIST, Role.ADMIN, Role.MANAGER), validate({ query: paginationQuerySchema }), prescriptionController.pendingReview);
router.patch('/:id/review', requireRole(Role.PHARMACIST, Role.ADMIN), validate({ body: reviewPrescriptionSchema }), prescriptionController.review);

export default router;
