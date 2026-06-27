import type { Request, Response } from 'express';
import { AuditAction, type PaginationQuery } from '@healthmart/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPaginated, sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import * as doctorService from '../services/doctor.service';
import * as appointmentService from '../services/appointment.service';
import { recordAudit } from '../middlewares/audit.middleware';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

// ---- Doctors ----

export const listDoctors = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await doctorService.listDoctors(req.query.specialization as string | undefined));
});

export const getDoctor = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await doctorService.getDoctorById(req.params.id as string));
});

export const getDoctorAvailability = asyncHandler(async (req: Request, res: Response) => {
  const date = req.query.date as string;
  if (!date) throw ApiError.badRequest('A "date" query parameter (YYYY-MM-DD) is required');
  sendSuccess(res, await doctorService.getAvailableSlots(req.params.id as string, date));
});

export const createDoctor = asyncHandler(async (req: Request, res: Response) => {
  const doctor = await doctorService.createDoctor(req.body);
  recordAudit({ req, action: AuditAction.CREATE, entityType: 'Doctor', entityId: String(doctor._id) });
  sendSuccess(res, doctor, 'Doctor onboarded', 201);
});

export const updateDoctor = asyncHandler(async (req: Request, res: Response) => {
  const doctor = await doctorService.updateDoctor(req.params.id as string, req.body);
  recordAudit({ req, action: AuditAction.UPDATE, entityType: 'Doctor', entityId: req.params.id });
  sendSuccess(res, doctor, 'Doctor updated');
});

export const getMyDoctorProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, await doctorService.getDoctorProfileByUserId(req.user!.id));
});

// ---- Appointments ----

export const bookAppointment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const returnUrlBase = req.body.returnUrlBase || req.headers.origin;
  const result = await appointmentService.bookAppointment(req.user!.id, { ...req.body, returnUrlBase });
  sendSuccess(res, result, 'Appointment booked, complete payment to confirm', 201);
});

export const listMyAppointments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, pagination } = await appointmentService.listMyAppointments(req.user!.id, page, limit);
  sendPaginated(res, items, pagination);
});

export const listDoctorAppointments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, pagination } = await appointmentService.listDoctorAppointments(req.user!.id, page, limit);
  sendPaginated(res, items, pagination);
});

export const getVideoToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, await appointmentService.getVideoToken(req.params.id as string, req.user!.id));
});

export const completeConsultation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const appointment = await appointmentService.completeConsultation(req.params.id as string, req.user!.id, req.body);
  sendSuccess(res, appointment, 'Consultation completed');
});

export const cancelAppointment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const appointment = await appointmentService.cancelAppointment(req.params.id as string, req.user!.id, req.body.reason);
  sendSuccess(res, appointment, 'Appointment cancelled');
});
