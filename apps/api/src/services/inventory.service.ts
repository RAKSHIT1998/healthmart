import { InventoryMovementType } from '@healthmart/shared';
import { batchRepository, inventoryRepository } from '../repositories';
import { InventoryMovementModel, type IBatchAllocation } from '../models';
import { ApiError } from '../utils/ApiError';

export interface ReservationItem {
  medicineId: string;
  branchId: string;
  quantity: number;
  medicineName?: string;
}

/**
 * Reserves stock for every line item, atomically and one at a time. If any
 * item can't be fully reserved, every reservation made so far in this call is
 * rolled back (compensating release) before throwing — callers never end up
 * with a partial hold. This is the mechanism that prevents overselling during
 * checkout.
 */
export async function reserveItems(items: ReservationItem[]): Promise<void> {
  const reserved: ReservationItem[] = [];

  for (const item of items) {
    const result = await inventoryRepository.reserveStock(item.medicineId, item.branchId, item.quantity);
    if (!result) {
      await releaseItems(reserved);
      throw ApiError.conflict(
        `${item.medicineName ?? 'One of the items'} in your cart just went out of stock. Please update your cart.`,
      );
    }
    reserved.push(item);
  }
}

export async function releaseItems(items: ReservationItem[]): Promise<void> {
  for (const item of items) {
    await inventoryRepository.releaseReservation(item.medicineId, item.branchId, item.quantity);
    await InventoryMovementModel.create({
      medicineId: item.medicineId,
      branchId: item.branchId,
      type: InventoryMovementType.RESERVATION_RELEASE,
      quantity: item.quantity,
    });
  }
}

/** Builds a FIFO allocation plan (oldest-expiry-first) without mutating any stock yet. */
export async function planFifoAllocation(
  medicineId: string,
  branchId: string,
  quantity: number,
): Promise<IBatchAllocation[]> {
  const candidates = await batchRepository.findFifoCandidates(medicineId, branchId);
  const allocations: IBatchAllocation[] = [];
  let remaining = quantity;

  for (const batch of candidates) {
    if (remaining <= 0) break;
    const take = Math.min(batch.quantityRemaining, remaining);
    allocations.push({
      batchId: batch._id,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      quantity: take,
    });
    remaining -= take;
  }

  // If batch records don't fully cover the quantity (e.g. data not yet synced from MARG),
  // the shortfall is still allowed through since Inventory.totalQuantity is the source of
  // truth for availability — but it's flagged with batchId=null for downstream visibility.
  if (remaining > 0) {
    allocations.push({
      batchId: undefined as never,
      batchNumber: 'UNTRACKED',
      expiryDate: new Date(),
      quantity: remaining,
    });
  }

  return allocations;
}

/** Commits a previously planned FIFO allocation: decrements batches, inventory totals, and logs the movement. */
export async function commitFifoConsumption(
  medicineId: string,
  branchId: string,
  allocations: IBatchAllocation[],
  referenceId?: string,
): Promise<void> {
  const totalQuantity = allocations.reduce((sum, a) => sum + a.quantity, 0);

  for (const allocation of allocations) {
    if (allocation.batchId) {
      await batchRepository.consumeFromBatch(String(allocation.batchId), allocation.quantity);
    }
    await InventoryMovementModel.create({
      medicineId,
      branchId,
      batchId: allocation.batchId || undefined,
      type: InventoryMovementType.SALE,
      quantity: allocation.quantity,
      referenceType: 'Order',
      referenceId,
    });
  }

  await inventoryRepository.consumeReservedStock(medicineId, branchId, totalQuantity);
}

/** Reverses a previously committed consumption (order cancelled/returned after stock was deducted). */
export async function restoreFifoConsumption(
  medicineId: string,
  branchId: string,
  allocations: IBatchAllocation[],
  referenceId?: string,
): Promise<void> {
  const totalQuantity = allocations.reduce((sum, a) => sum + a.quantity, 0);

  for (const allocation of allocations) {
    if (allocation.batchId) {
      await batchRepository.restoreToBatch(String(allocation.batchId), allocation.quantity);
    }
    await InventoryMovementModel.create({
      medicineId,
      branchId,
      batchId: allocation.batchId || undefined,
      type: InventoryMovementType.RETURN,
      quantity: allocation.quantity,
      referenceType: 'Order',
      referenceId,
    });
  }

  await inventoryRepository.addStock(medicineId, branchId, totalQuantity);
}

export interface ReceivePurchaseInput {
  medicineId: string;
  branchId: string;
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  costPrice: number;
  supplierId?: string;
  rackNumber?: string;
  warehouse?: string;
}

export async function receivePurchase(input: ReceivePurchaseInput) {
  const batch = await batchRepository.create({
    medicineId: input.medicineId,
    branchId: input.branchId,
    batchNumber: input.batchNumber,
    expiryDate: input.expiryDate,
    quantityReceived: input.quantity,
    quantityRemaining: input.quantity,
    costPrice: input.costPrice,
    supplierId: input.supplierId,
    rackNumber: input.rackNumber,
    warehouse: input.warehouse,
  } as never);

  await inventoryRepository.addStock(input.medicineId, input.branchId, input.quantity);
  await InventoryMovementModel.create({
    medicineId: input.medicineId,
    branchId: input.branchId,
    batchId: batch._id,
    type: InventoryMovementType.PURCHASE,
    quantity: input.quantity,
    referenceType: 'Batch',
    referenceId: batch._id,
  });

  return batch;
}

export async function listAll(branchId: string | undefined, page: number, limit: number) {
  return inventoryRepository.findAll(branchId, page, limit);
}

export interface WriteOffBatchInput {
  batchId: string;
  quantity: number;
  reason: 'damaged' | 'expired';
  notes?: string;
  createdBy?: string;
}

/** Scraps `quantity` units of a batch (damaged/expired) — removes it from both the batch and the inventory total, and logs the movement. */
export async function writeOffBatch(input: WriteOffBatchInput) {
  const batch = await batchRepository.findById(input.batchId);
  if (!batch) throw ApiError.notFound('Batch not found');
  if (input.quantity > batch.quantityRemaining) {
    throw ApiError.badRequest(`Cannot write off ${input.quantity} units — only ${batch.quantityRemaining} remaining in this batch`);
  }

  const updatedBatch = await batchRepository.consumeFromBatch(String(batch._id), input.quantity);
  await inventoryRepository.removeStock(String(batch.medicineId), String(batch.branchId), input.quantity);
  await InventoryMovementModel.create({
    medicineId: batch.medicineId,
    branchId: batch.branchId,
    batchId: batch._id,
    type: input.reason === 'expired' ? InventoryMovementType.EXPIRED : InventoryMovementType.ADJUSTMENT,
    quantity: input.quantity,
    referenceType: 'Batch',
    referenceId: batch._id,
    createdBy: input.createdBy,
    notes: input.notes,
  });

  return updatedBatch;
}

export async function updateLowStockThreshold(medicineId: string, branchId: string, lowStockThreshold: number) {
  const updated = await inventoryRepository.updateLowStockThreshold(medicineId, branchId, lowStockThreshold);
  if (!updated) throw ApiError.notFound('Inventory record not found for this medicine/branch');
  return updated;
}

export interface MovementFilters {
  medicineId?: string;
  branchId?: string;
  type?: string;
}

export async function listMovements(filters: MovementFilters, page: number, limit: number) {
  const filter: Record<string, unknown> = {};
  if (filters.medicineId) filter.medicineId = filters.medicineId;
  if (filters.branchId) filter.branchId = filters.branchId;
  if (filters.type) filter.type = filters.type;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    InventoryMovementModel.find(filter)
      .populate('medicineId', 'name slug')
      .populate('branchId', 'name code')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    InventoryMovementModel.countDocuments(filter),
  ]);

  return { items, total };
}

export async function getLowStock(branchId?: string) {
  return inventoryRepository.findLowStock(branchId);
}

export async function getExpiringSoon(branchId?: string, withinDays?: number) {
  return batchRepository.findExpiringSoon(branchId, withinDays);
}

export async function getInventoryValue(branchId?: string) {
  return inventoryRepository.getInventoryValue(branchId);
}

export async function getAvailability(medicineId: string, branchId: string) {
  return inventoryRepository.getAvailability(medicineId, branchId);
}
