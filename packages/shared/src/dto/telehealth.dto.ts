import { z } from 'zod';
import { objectIdSchema } from './common.dto';
import { REGEX } from '../constants';

const weeklySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use HH:mm format'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use HH:mm format'),
  slotDurationMinutes: z.number().int().min(10).max(120).default(30),
});

export const createDoctorSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().regex(REGEX.EMAIL),
  phone: z.string().regex(REGEX.PHONE),
  password: z.string().min(8),
  specialization: z.string().min(2).max(100),
  qualification: z.string().min(2).max(150),
  experienceYears: z.number().int().min(0).max(70),
  consultationFee: z.number().positive(),
  languages: z.array(z.string()).default(['English']),
  about: z.string().max(1000).optional(),
  profileImage: z.string().url().optional(),
  supportsVideo: z.boolean().default(true),
  supportsAudio: z.boolean().default(true),
  weeklySchedule: z.array(weeklySlotSchema).default([]),
});

export const updateDoctorSchema = z.object({
  specialization: z.string().min(2).max(100),
  qualification: z.string().min(2).max(150),
  experienceYears: z.number().int().min(0).max(70),
  consultationFee: z.number().positive(),
  languages: z.array(z.string()),
  about: z.string().max(1000),
  profileImage: z.string().url(),
  supportsVideo: z.boolean(),
  supportsAudio: z.boolean(),
  weeklySchedule: z.array(weeklySlotSchema),
  isActive: z.boolean(),
}).partial();

export const bookAppointmentSchema = z.object({
  doctorId: objectIdSchema,
  scheduledAt: z.string().datetime(),
  type: z.enum(['video', 'audio']),
  notes: z.string().max(500).optional(),
  returnUrlBase: z.string().url().optional(),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().min(3).max(300),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['in_progress', 'completed', 'cancelled', 'no_show']),
  reason: z.string().max(300).optional(),
});

export const prescribedMedicineSchema = z.object({
  name: z.string().min(1).max(150),
  dosage: z.string().max(100).optional(),
  instructions: z.string().max(300).optional(),
});

export const completeConsultationSchema = z.object({
  diagnosis: z.string().min(2).max(1000),
  prescribedMedicines: z.array(prescribedMedicineSchema).default([]),
  followUpDate: z.string().datetime().optional(),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type CompleteConsultationInput = z.infer<typeof completeConsultationSchema>;
