import { ReturnStatus } from '@buymedicines/shared';
import { BaseRepository } from './BaseRepository';
import { ReturnRequestModel, type IReturnRequest } from '../models';

class ReturnRequestRepository extends BaseRepository<IReturnRequest> {
  constructor() {
    super(ReturnRequestModel);
  }

  async listForUser(userId: string, page: number, limit: number) {
    return this.paginate({ userId }, { page, limit, populate: 'orderId' });
  }

  async listPending(page: number, limit: number) {
    return this.paginate(
      { status: ReturnStatus.REQUESTED },
      { page, limit, populate: ['userId', 'orderId'], sort: { createdAt: 1 } },
    );
  }

  async listAll(status: string | undefined, page: number, limit: number) {
    return this.paginate(
      status ? { status } : {},
      { page, limit, populate: ['userId', 'orderId'], sort: { createdAt: -1 } },
    );
  }

  /** Sum of quantities already requested (in any non-rejected state) for a medicine on an order — used to cap further return requests. */
  async getReturnedQuantity(orderId: string, medicineId: string): Promise<number> {
    const requests = await this.model.find({
      orderId,
      status: { $ne: ReturnStatus.REJECTED },
      'items.medicineId': medicineId,
    });
    return requests.reduce((sum, req) => {
      const item = req.items.find((i) => String(i.medicineId) === medicineId);
      return sum + (item?.quantity ?? 0);
    }, 0);
  }
}

export const returnRequestRepository = new ReturnRequestRepository();
