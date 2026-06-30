import { z } from 'zod';
import { REGEX } from '../constants';
import { objectIdSchema } from './common.dto';

export const createServiceablePincodeSchema = z.object({
  pincode: z.string().regex(REGEX.PINCODE),
  branchId: objectIdSchema,
  estimatedDeliveryMinutes: z.number().int().min(5).max(1440),
  isActive: z.boolean().default(true),
});

export const updateServiceablePincodeSchema = z
  .object({
    estimatedDeliveryMinutes: z.number().int().min(5).max(1440),
    isActive: z.boolean(),
  })
  .partial();

export type CreateServiceablePincodeInput = z.infer<typeof createServiceablePincodeSchema>;
export type UpdateServiceablePincodeInput = z.infer<typeof updateServiceablePincodeSchema>;

export interface ServiceabilityCheckResult {
  serviceable: boolean;
  pincode: string;
  estimatedDeliveryMinutes?: number;
  branchName?: string;
}

export const cityPincodeLookupQuerySchema = z.object({
  city: z.string().min(2).max(100),
});

export type CityPincodeLookupQuery = z.infer<typeof cityPincodeLookupQuerySchema>;

export const bulkCreateServiceablePincodesSchema = z.object({
  pincodes: z.array(z.string().regex(REGEX.PINCODE)).min(1).max(500),
  branchId: objectIdSchema,
  estimatedDeliveryMinutes: z.number().int().min(5).max(1440),
});

export type BulkCreateServiceablePincodesInput = z.infer<typeof bulkCreateServiceablePincodesSchema>;
