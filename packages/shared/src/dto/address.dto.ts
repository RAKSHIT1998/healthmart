import { z } from 'zod';
import { REGEX } from '../constants';

export const addressSchema = z.object({
  label: z.enum(['home', 'work', 'other']).default('home'),
  contactName: z.string().min(2).max(80),
  contactPhone: z.string().regex(REGEX.PHONE),
  line1: z.string().min(3).max(150),
  line2: z.string().max(150).optional(),
  landmark: z.string().max(100).optional(),
  city: z.string().min(2).max(60),
  state: z.string().min(2).max(60),
  pincode: z.string().regex(REGEX.PINCODE),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = addressSchema.partial();

export type AddressInput = z.infer<typeof addressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
