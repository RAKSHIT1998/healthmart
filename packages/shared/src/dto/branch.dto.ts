import { z } from 'zod';
import { REGEX } from '../constants';

export const createBranchSchema = z.object({
  name: z.string().min(2).max(120),
  code: z.string().min(2).max(20),
  phone: z.string().regex(REGEX.PHONE).optional(),
  address: z.string().min(3).max(200),
  city: z.string().min(2).max(60),
  state: z.string().min(2).max(60),
  pincode: z.string().regex(REGEX.PINCODE),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  gstin: z.string().regex(REGEX.GSTIN).optional(),
  isMainBranch: z.boolean().default(false),
});

export const updateBranchSchema = z
  .object({
    name: z.string().min(2).max(120),
    phone: z.string().regex(REGEX.PHONE),
    address: z.string().min(3).max(200),
    city: z.string().min(2).max(60),
    state: z.string().min(2).max(60),
    pincode: z.string().regex(REGEX.PINCODE),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    gstin: z.string().regex(REGEX.GSTIN),
    isMainBranch: z.boolean(),
    isActive: z.boolean(),
  })
  .partial();

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
