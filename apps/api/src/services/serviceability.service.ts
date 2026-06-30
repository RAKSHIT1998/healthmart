import type {
  BulkCreateServiceablePincodesInput,
  CreateServiceablePincodeInput,
  ServiceabilityCheckResult,
  UpdateServiceablePincodeInput,
} from '@healthmart/shared';
import { serviceablePincodeRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import { lookupPincodesByCity, type CityPincodeResult } from '../integrations/indiaPost';

export async function checkServiceability(pincode: string): Promise<ServiceabilityCheckResult> {
  const match = await serviceablePincodeRepository.findBestForPincode(pincode);
  if (!match) return { serviceable: false, pincode };

  const branch = match.branchId as unknown as { name: string } | null;
  return {
    serviceable: true,
    pincode,
    estimatedDeliveryMinutes: match.estimatedDeliveryMinutes,
    branchName: branch?.name,
  };
}

export async function createServiceablePincode(input: CreateServiceablePincodeInput) {
  const exists = await serviceablePincodeRepository.exists({ pincode: input.pincode, branchId: input.branchId });
  if (exists) throw ApiError.conflict('This branch already serves this pincode');
  return serviceablePincodeRepository.create(input as never);
}

export async function listServiceablePincodes(page: number, limit: number) {
  return serviceablePincodeRepository.listAll(page, limit);
}

export async function updateServiceablePincode(id: string, input: UpdateServiceablePincodeInput) {
  const updated = await serviceablePincodeRepository.updateById(id, input);
  if (!updated) throw ApiError.notFound('Serviceable pincode entry not found');
  return updated;
}

export async function deleteServiceablePincode(id: string) {
  const deleted = await serviceablePincodeRepository.deleteById(id);
  if (!deleted) throw ApiError.notFound('Serviceable pincode entry not found');
}

export async function lookupCityPincodes(city: string): Promise<CityPincodeResult[]> {
  const results = await lookupPincodesByCity(city);
  if (results.length === 0) {
    throw ApiError.notFound(`No pincodes found for "${city}". Check the spelling, or add pincodes individually.`);
  }
  return results;
}

/** Adds many pincodes for one branch in one go; silently skips ones already serviced by this branch. */
export async function bulkCreateServiceablePincodes(input: BulkCreateServiceablePincodesInput) {
  let created = 0;
  let skipped = 0;

  for (const pincode of input.pincodes) {
    const exists = await serviceablePincodeRepository.exists({ pincode, branchId: input.branchId });
    if (exists) {
      skipped++;
      continue;
    }
    await serviceablePincodeRepository.create({
      pincode,
      branchId: input.branchId,
      estimatedDeliveryMinutes: input.estimatedDeliveryMinutes,
      isActive: true,
    } as never);
    created++;
  }

  return { created, skipped, total: input.pincodes.length };
}
