import type { BulkUpdateRowInput } from '@buymedicines/shared';
import { InventoryMovementType } from '@buymedicines/shared';
import { medicineRepository, inventoryRepository } from '../repositories';
import { InventoryMovementModel } from '../models';
import { parseUploadedFile, normalizeBulkUpdateRow } from '../integrations/bulkUpdate/parseUploadedFile';
import { ApiError } from '../utils/ApiError';

export interface BulkUpdateFieldSet {
  name?: string;
  mrp?: number;
  sellingPrice?: number;
  gstPercentage?: number;
  hsnCode?: string;
  packSize?: string;
  isActive?: boolean;
  stockQuantity?: number;
}

export interface BulkUpdatePreviewRow {
  rowIndex: number;
  identifier: string;
  matchedMedicineId: string | null;
  matchedMedicineName: string | null;
  matchStatus: 'matched' | 'not_found' | 'ambiguous';
  current: BulkUpdateFieldSet;
  proposed: BulkUpdateFieldSet;
  changedFields: string[];
  errors: string[];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Parses the uploaded file and matches each row to a Medicine, diffing proposed vs. current values without writing anything. */
export async function previewBulkUpdate(
  buffer: Buffer,
  originalName: string,
  branchId: string,
): Promise<BulkUpdatePreviewRow[]> {
  const rawRows = await parseUploadedFile(buffer, originalName);
  const results: BulkUpdatePreviewRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const normalized = normalizeBulkUpdateRow(rawRows[i]!);
    const identifier = normalized.identifier ?? normalized.name ?? '';
    const errors: string[] = [];

    let medicine = null;
    let matchStatus: BulkUpdatePreviewRow['matchStatus'] = 'not_found';

    if (!normalized.identifier && !normalized.name) {
      errors.push('Row is missing both an SKU/item code and a product name');
    } else {
      if (normalized.identifier) {
        medicine = await medicineRepository.findByMargItemCode(normalized.identifier);
      }
      if (!medicine && normalized.name) {
        const matches = await medicineRepository.find({
          name: new RegExp(`^${escapeRegex(normalized.name)}$`, 'i'),
        });
        if (matches.length === 1) {
          medicine = matches[0]!;
        } else if (matches.length > 1) {
          matchStatus = 'ambiguous';
          errors.push(`${matches.length} products share the name "${normalized.name}" — use an SKU/item code instead`);
        }
      }
      if (medicine) matchStatus = 'matched';
      else if (matchStatus !== 'ambiguous') errors.push(`No product found matching "${identifier}"`);
    }

    const current: BulkUpdateFieldSet = {};
    const proposed: BulkUpdateFieldSet = {};
    const changedFields: string[] = [];

    if (medicine) {
      current.name = medicine.name;
      current.mrp = medicine.mrp;
      current.sellingPrice = medicine.sellingPrice;
      current.gstPercentage = medicine.gstPercentage;
      current.hsnCode = medicine.hsnCode;
      current.packSize = medicine.packSize;
      current.isActive = medicine.isActive;

      const availability = await inventoryRepository.getAvailability(String(medicine._id), branchId);
      current.stockQuantity = availability.totalQuantity;

      if (normalized.name !== undefined) proposed.name = normalized.name;
      if (normalized.mrp !== undefined) proposed.mrp = normalized.mrp;
      if (normalized.sellingPrice !== undefined) proposed.sellingPrice = normalized.sellingPrice;
      if (normalized.gstPercentage !== undefined) proposed.gstPercentage = normalized.gstPercentage;
      if (normalized.hsnCode !== undefined) proposed.hsnCode = normalized.hsnCode;
      if (normalized.packSize !== undefined) proposed.packSize = normalized.packSize;
      if (normalized.isActive !== undefined) proposed.isActive = normalized.isActive;
      if (normalized.stockQuantity !== undefined) proposed.stockQuantity = normalized.stockQuantity;

      for (const key of Object.keys(proposed) as (keyof BulkUpdateFieldSet)[]) {
        if (proposed[key] !== current[key]) changedFields.push(key);
      }

      const finalMrp = proposed.mrp ?? current.mrp;
      const finalSellingPrice = proposed.sellingPrice ?? current.sellingPrice;
      if (finalSellingPrice !== undefined && finalMrp !== undefined && finalSellingPrice > finalMrp) {
        errors.push('Selling price cannot exceed MRP');
      }
      if (proposed.mrp !== undefined && proposed.mrp <= 0) errors.push('Invalid MRP');
      if (proposed.sellingPrice !== undefined && proposed.sellingPrice <= 0) errors.push('Invalid selling price');
      if (proposed.gstPercentage !== undefined && (proposed.gstPercentage < 0 || proposed.gstPercentage > 28)) {
        errors.push('GST must be between 0 and 28');
      }
      if (proposed.stockQuantity !== undefined) {
        if (proposed.stockQuantity < 0) errors.push('Stock quantity cannot be negative');
        else if (proposed.stockQuantity < availability.reservedQuantity) {
          errors.push(`Cannot set stock below ${availability.reservedQuantity} units currently reserved`);
        }
      }
      if (changedFields.length === 0) errors.push('No changed fields found in this row');
    }

    results.push({
      rowIndex: i,
      identifier,
      matchedMedicineId: medicine ? String(medicine._id) : null,
      matchedMedicineName: medicine?.name ?? null,
      matchStatus,
      current,
      proposed,
      changedFields,
      errors,
    });
  }

  return results;
}

export interface CommitBulkUpdateResult {
  updated: number;
  skipped: number;
  total: number;
  errors: { row: number; message: string }[];
}

/** Applies a reviewed/selected set of bulk-update rows. Sequential, per-row try/catch — one bad row never aborts the rest. */
export async function commitBulkUpdate(
  rows: BulkUpdateRowInput[],
  branchId: string,
  userId?: string,
): Promise<CommitBulkUpdateResult> {
  let updated = 0;
  let skipped = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    try {
      const medicine = await medicineRepository.findById(row.medicineId);
      if (!medicine) throw ApiError.notFound('Medicine no longer exists');

      const finalMrp = row.mrp ?? medicine.mrp;
      const finalSellingPrice = row.sellingPrice ?? medicine.sellingPrice;
      if (finalSellingPrice > finalMrp) throw ApiError.badRequest('Selling price cannot exceed MRP');

      let stockDelta = 0;
      if (row.stockQuantity !== undefined) {
        const availability = await inventoryRepository.getAvailability(row.medicineId, branchId);
        if (row.stockQuantity < availability.reservedQuantity) {
          throw ApiError.badRequest(`Cannot set stock below ${availability.reservedQuantity} units currently reserved`);
        }
        stockDelta = row.stockQuantity - availability.totalQuantity;
      }

      const medicineUpdate: Record<string, unknown> = {};
      if (row.name !== undefined) medicineUpdate.name = row.name;
      if (row.mrp !== undefined) medicineUpdate.mrp = row.mrp;
      if (row.sellingPrice !== undefined) medicineUpdate.sellingPrice = row.sellingPrice;
      if (row.gstPercentage !== undefined) medicineUpdate.gstPercentage = row.gstPercentage;
      if (row.hsnCode !== undefined) medicineUpdate.hsnCode = row.hsnCode;
      if (row.packSize !== undefined) medicineUpdate.packSize = row.packSize;
      if (row.isActive !== undefined) medicineUpdate.isActive = row.isActive;

      if (Object.keys(medicineUpdate).length > 0) {
        await medicineRepository.updateById(row.medicineId, medicineUpdate);
      }

      if (row.stockQuantity !== undefined) {
        await inventoryRepository.setTotalQuantity(row.medicineId, branchId, row.stockQuantity);
        if (stockDelta !== 0) {
          await InventoryMovementModel.create({
            medicineId: row.medicineId,
            branchId,
            type: InventoryMovementType.ADJUSTMENT,
            quantity: Math.abs(stockDelta),
            createdBy: userId,
            notes: `Bulk update via file upload (stock ${stockDelta > 0 ? 'increased' : 'decreased'})`,
          });
        }
      }

      updated++;
    } catch (err) {
      skipped++;
      errors.push({ row: i, message: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  return { updated, skipped, total: rows.length, errors };
}
