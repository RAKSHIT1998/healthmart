import { z } from 'zod';
import { MedicineRequestStatus } from '../enums/misc.enum';

export const createMedicineRequestSchema = z.object({
  medicineName: z.string().min(2).max(200),
  notes: z.string().max(500).optional(),
});

export type CreateMedicineRequestInput = z.infer<typeof createMedicineRequestSchema>;

export const updateMedicineRequestStatusSchema = z.object({
  status: z.nativeEnum(MedicineRequestStatus),
  adminNotes: z.string().max(500).optional(),
});

export type UpdateMedicineRequestStatusInput = z.infer<typeof updateMedicineRequestStatusSchema>;
