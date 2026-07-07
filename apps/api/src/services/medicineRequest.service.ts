import type { CreateMedicineRequestInput } from '@buymedicines/shared';
import { MedicineRequestStatus } from '@buymedicines/shared';
import { medicineRequestRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';

export async function createMedicineRequest(userId: string, input: CreateMedicineRequestInput) {
  return medicineRequestRepository.create({
    userId,
    medicineName: input.medicineName,
    notes: input.notes,
    status: MedicineRequestStatus.PENDING,
  } as never);
}

export async function listMyMedicineRequests(userId: string, page: number, limit: number) {
  return medicineRequestRepository.listForUser(userId, page, limit);
}

export async function listAllMedicineRequests(status: string | undefined, page: number, limit: number) {
  return medicineRequestRepository.listAll(status, page, limit);
}

export async function updateMedicineRequestStatus(
  requestId: string,
  status: MedicineRequestStatus,
  adminNotes: string | undefined,
) {
  const request = await medicineRequestRepository.findById(requestId);
  if (!request) throw ApiError.notFound('Medicine request not found');

  request.status = status;
  if (adminNotes !== undefined) request.adminNotes = adminNotes;
  await request.save();

  return request;
}
