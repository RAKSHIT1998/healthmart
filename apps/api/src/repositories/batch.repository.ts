import { BaseRepository } from './BaseRepository';
import { BatchModel, type IBatch } from '../models';
import { EXPIRY_ALERT_WINDOW_DAYS } from '@healthmart/shared';

class BatchRepository extends BaseRepository<IBatch> {
  constructor() {
    super(BatchModel);
  }

  /** Batches with remaining stock for a medicine+branch, oldest expiry first (FIFO). */
  async findFifoCandidates(medicineId: string, branchId: string) {
    return this.model
      .find({ medicineId, branchId, quantityRemaining: { $gt: 0 } })
      .sort({ expiryDate: 1 });
  }

  /** Atomically consumes `quantity` units from a single batch; fails (returns null) if insufficient remaining stock. */
  async consumeFromBatch(batchId: string, quantity: number) {
    return this.model.findOneAndUpdate(
      { _id: batchId, quantityRemaining: { $gte: quantity } },
      { $inc: { quantityRemaining: -quantity } },
      { new: true },
    );
  }

  async restoreToBatch(batchId: string, quantity: number) {
    return this.model.findByIdAndUpdate(batchId, { $inc: { quantityRemaining: quantity } }, { new: true });
  }

  async findExpiringSoon(branchId?: string, withinDays = EXPIRY_ALERT_WINDOW_DAYS) {
    const cutoff = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000);
    return this.model
      .find({
        ...(branchId ? { branchId } : {}),
        quantityRemaining: { $gt: 0 },
        expiryDate: { $lte: cutoff },
      })
      .populate('medicineId', 'name slug')
      .sort({ expiryDate: 1 });
  }

  async findByMargBatchRef(margBatchRef: string) {
    return this.model.findOne({ margBatchRef });
  }
}

export const batchRepository = new BatchRepository();
