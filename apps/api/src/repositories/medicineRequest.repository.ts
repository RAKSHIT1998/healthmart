import { BaseRepository } from './BaseRepository';
import { MedicineRequestModel, type IMedicineRequest } from '../models';

class MedicineRequestRepository extends BaseRepository<IMedicineRequest> {
  constructor() {
    super(MedicineRequestModel);
  }

  async listForUser(userId: string, page: number, limit: number) {
    return this.paginate({ userId }, { page, limit, sort: { createdAt: -1 } });
  }

  async listAll(status: string | undefined, page: number, limit: number) {
    return this.paginate(
      status ? { status } : {},
      { page, limit, populate: 'userId', sort: { createdAt: -1 } },
    );
  }
}

export const medicineRequestRepository = new MedicineRequestRepository();
