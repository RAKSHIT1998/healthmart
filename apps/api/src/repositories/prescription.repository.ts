import { PrescriptionStatus } from '@buymedicines/shared';
import { BaseRepository } from './BaseRepository';
import { PrescriptionModel, type IPrescription } from '../models';

class PrescriptionRepository extends BaseRepository<IPrescription> {
  constructor() {
    super(PrescriptionModel);
  }

  async listForUser(userId: string, page: number, limit: number) {
    return this.paginate({ userId }, { page, limit });
  }

  async listPendingReview(page: number, limit: number) {
    return this.paginate(
      { status: { $in: [PrescriptionStatus.PENDING, PrescriptionStatus.OCR_PROCESSED, PrescriptionStatus.UNDER_REVIEW] } },
      { page, limit, populate: 'userId', sort: { createdAt: 1 } },
    );
  }
}

export const prescriptionRepository = new PrescriptionRepository();
