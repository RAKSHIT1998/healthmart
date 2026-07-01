import { NotificationChannel, NotificationType, PrescriptionStatus, type ReviewPrescriptionInput } from '@buymedicines/shared';
import { medicineRepository, prescriptionRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import { getOcrProvider } from '../integrations/ocr';
import { notifyUser } from './notification.service';
import { logger } from '../config/logger';

async function findCandidateMedicines(matchedTerms: string[]) {
  if (matchedTerms.length === 0) return [];
  const query = matchedTerms.slice(0, 15).join(' ');
  const results = await medicineRepository.search({
    q: query,
    sortBy: 'relevance',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
  } as never);
  return results.items.map((m) => m._id);
}

export async function uploadPrescription(userId: string, imageUrls: string[], notes?: string) {
  const prescription = await prescriptionRepository.create({
    userId,
    imageUrls,
    notes,
    status: PrescriptionStatus.PENDING,
  } as never);

  try {
    const ocrProvider = getOcrProvider();
    const results = await Promise.all(imageUrls.map((url) => ocrProvider.extractText(url)));

    const rawText = results.map((r) => r.rawText).join('\n');
    const matchedTerms = Array.from(new Set(results.flatMap((r) => r.matchedTerms)));
    const matchedMedicineIds = await findCandidateMedicines(matchedTerms);

    prescription.ocrRawText = rawText;
    prescription.ocrMatchedTerms = matchedTerms;
    prescription.matchedMedicineIds = matchedMedicineIds as never;
    prescription.status = PrescriptionStatus.OCR_PROCESSED;
    await prescription.save();
  } catch (err) {
    logger.error({ err, prescriptionId: prescription._id }, 'OCR processing failed; leaving prescription pending manual review');
  }

  return prescription;
}

export async function listMyPrescriptions(userId: string, page: number, limit: number) {
  return prescriptionRepository.listForUser(userId, page, limit);
}

export async function listPendingPrescriptions(page: number, limit: number) {
  return prescriptionRepository.listPendingReview(page, limit);
}

export async function reviewPrescription(prescriptionId: string, reviewerId: string, input: ReviewPrescriptionInput) {
  const prescription = await prescriptionRepository.findById(prescriptionId);
  if (!prescription) throw ApiError.notFound('Prescription not found');

  prescription.status = input.status === 'approved' ? PrescriptionStatus.APPROVED : PrescriptionStatus.REJECTED;
  prescription.reviewedBy = reviewerId as never;
  prescription.reviewedAt = new Date();
  prescription.rejectionReason = input.rejectionReason;
  if (input.matchedMedicineIds.length > 0) {
    prescription.matchedMedicineIds = input.matchedMedicineIds as never;
  }
  await prescription.save();

  await notifyUser({
    userId: String(prescription.userId),
    type: NotificationType.PRESCRIPTION_UPDATE,
    title: `Prescription ${input.status}`,
    message:
      input.status === 'approved'
        ? 'Your prescription has been approved. You can now proceed to order the prescribed medicines.'
        : `Your prescription was rejected. ${input.rejectionReason ?? ''}`.trim(),
    channels: [NotificationChannel.IN_APP, NotificationChannel.SMS],
  });

  return prescription;
}
