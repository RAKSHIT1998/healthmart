import { z } from 'zod';
import { REGEX } from '../constants';

export const createDriverSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().regex(REGEX.PHONE),
  email: z.string().regex(REGEX.EMAIL).optional(),
  vehicleType: z.enum(['bike', 'scooter', 'bicycle', 'car']),
  vehicleNumber: z.string().max(20).optional(),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/),
});

export const updateDriverLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const updateDriverAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverLocationInput = z.infer<typeof updateDriverLocationSchema>;
