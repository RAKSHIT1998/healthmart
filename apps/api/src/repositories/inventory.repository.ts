import { Types } from 'mongoose';
import { BaseRepository } from './BaseRepository';
import { InventoryModel, type IInventory } from '../models';
import { LOW_STOCK_THRESHOLD_UNITS } from '@healthmart/shared';

class InventoryRepository extends BaseRepository<IInventory> {
  constructor() {
    super(InventoryModel);
  }

  async findOrCreate(medicineId: string, branchId: string) {
    return this.model.findOneAndUpdate(
      { medicineId, branchId },
      { $setOnInsert: { medicineId, branchId, totalQuantity: 0, reservedQuantity: 0 } },
      { upsert: true, new: true },
    );
  }

  async getAvailability(medicineId: string, branchId: string) {
    const doc = await this.model.findOne({ medicineId, branchId });
    if (!doc) return { totalQuantity: 0, reservedQuantity: 0, availableQuantity: 0 };
    return {
      totalQuantity: doc.totalQuantity,
      reservedQuantity: doc.reservedQuantity,
      availableQuantity: Math.max(0, doc.totalQuantity - doc.reservedQuantity),
    };
  }

  /**
   * Atomically reserves `quantity` units, guarded by $expr so the reservation can
   * never push reservedQuantity above totalQuantity — this is the core "never
   * oversell" guarantee. Returns null when there isn't enough available stock.
   */
  async reserveStock(medicineId: string, branchId: string, quantity: number) {
    return this.model.findOneAndUpdate(
      {
        medicineId,
        branchId,
        $expr: { $gte: [{ $subtract: ['$totalQuantity', '$reservedQuantity'] }, quantity] },
      },
      { $inc: { reservedQuantity: quantity } },
      { new: true },
    );
  }

  async releaseReservation(medicineId: string, branchId: string, quantity: number) {
    return this.model.findOneAndUpdate(
      { medicineId, branchId, reservedQuantity: { $gte: quantity } },
      { $inc: { reservedQuantity: -quantity } },
      { new: true },
    );
  }

  /** Confirms a sale: removes the units from both the reservation and the physical total. */
  async consumeReservedStock(medicineId: string, branchId: string, quantity: number) {
    return this.model.findOneAndUpdate(
      { medicineId, branchId, reservedQuantity: { $gte: quantity }, totalQuantity: { $gte: quantity } },
      { $inc: { reservedQuantity: -quantity, totalQuantity: -quantity } },
      { new: true },
    );
  }

  async addStock(medicineId: string, branchId: string, quantity: number) {
    return this.model.findOneAndUpdate(
      { medicineId, branchId },
      { $inc: { totalQuantity: quantity }, $setOnInsert: { reservedQuantity: 0 } },
      { upsert: true, new: true },
    );
  }

  async setTotalQuantity(medicineId: string, branchId: string, totalQuantity: number) {
    return this.model.findOneAndUpdate(
      { medicineId, branchId },
      { $set: { totalQuantity, lastSyncedFromMargAt: new Date() }, $setOnInsert: { reservedQuantity: 0 } },
      { upsert: true, new: true },
    );
  }

  async findLowStock(branchId?: string) {
    return this.model
      .find({
        ...(branchId ? { branchId } : {}),
        $expr: {
          $lte: [{ $subtract: ['$totalQuantity', '$reservedQuantity'] }, '$lowStockThreshold'],
        },
      })
      .populate('medicineId', 'name slug sellingPrice')
      .sort({ totalQuantity: 1 });
  }

  async getInventoryValue(branchId?: string): Promise<number> {
    const result = await this.model.aggregate<{ total: number }>([
      ...(branchId ? [{ $match: { branchId: new Types.ObjectId(branchId) } }] : []),
      {
        $lookup: {
          from: 'medicines',
          localField: 'medicineId',
          foreignField: '_id',
          as: 'medicine',
        },
      },
      { $unwind: '$medicine' },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ['$totalQuantity', '$medicine.sellingPrice'] } },
        },
      },
    ]);
    return result[0]?.total ?? 0;
  }
}

export const inventoryRepository = new InventoryRepository();
export { LOW_STOCK_THRESHOLD_UNITS };
