import { z } from 'zod';
import { objectIdSchema } from './common.dto';

export const uploadPrescriptionSchema = z.object({
  imageUrls: z.array(z.string().url()).min(1).max(5),
  notes: z.string().max(300).optional(),
});

export const reviewPrescriptionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().max(300).optional(),
  matchedMedicineIds: z.array(objectIdSchema).default([]),
});

export type UploadPrescriptionInput = z.infer<typeof uploadPrescriptionSchema>;
export type ReviewPrescriptionInput = z.infer<typeof reviewPrescriptionSchema>;
