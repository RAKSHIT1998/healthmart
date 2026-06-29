import type { CreateServiceablePincodeInput, ServiceabilityCheckResult, UpdateServiceablePincodeInput } from '@healthmart/shared';
import { serviceablePincodeRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';

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
