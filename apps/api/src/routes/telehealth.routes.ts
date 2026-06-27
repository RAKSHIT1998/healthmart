import { Router } from 'express';
import {
  Role,
  bookAppointmentSchema,
  cancelAppointmentSchema,
  completeConsultationSchema,
  createDoctorSchema,
  objectIdSchema,
  paginationQuerySchema,
  updateDoctorSchema,
} from '@healthmart/shared';
import { z } from 'zod';
import * as telehealthController from '../controllers/telehealth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

// Public
router.get('/doctors', telehealthController.listDoctors);
router.get('/doctors/:id', validate({ params: z.object({ id: objectIdSchema }) }), telehealthController.getDoctor);
router.get(
  '/doctors/:id/availability',
  validate({ params: z.object({ id: objectIdSchema }) }),
  telehealthController.getDoctorAvailability,
);

router.use(authenticate);

// Doctor onboarding/management (Admin)
router.post('/doctors', requireRole(Role.ADMIN), validate({ body: createDoctorSchema }), telehealthController.createDoctor);
router.patch(
  '/doctors/:id',
  requireRole(Role.ADMIN),
  validate({ params: z.object({ id: objectIdSchema }), body: updateDoctorSchema }),
  telehealthController.updateDoctor,
);

// Doctor's own view
router.get('/doctor/me', requireRole(Role.DOCTOR), telehealthController.getMyDoctorProfile);
router.get(
  '/doctor/appointments',
  requireRole(Role.DOCTOR),
  validate({ query: paginationQuerySchema }),
  telehealthController.listDoctorAppointments,
);
router.post(
  '/appointments/:id/complete',
  requireRole(Role.DOCTOR),
  validate({ params: z.object({ id: objectIdSchema }), body: completeConsultationSchema }),
  telehealthController.completeConsultation,
);

// Patient
router.post('/appointments', validate({ body: bookAppointmentSchema }), telehealthController.bookAppointment);
router.get('/appointments/mine', validate({ query: paginationQuerySchema }), telehealthController.listMyAppointments);
router.post(
  '/appointments/:id/cancel',
  validate({ params: z.object({ id: objectIdSchema }), body: cancelAppointmentSchema }),
  telehealthController.cancelAppointment,
);

// Shared (either participant)
router.get(
  '/appointments/:id/video-token',
  validate({ params: z.object({ id: objectIdSchema }) }),
  telehealthController.getVideoToken,
);

export default router;
