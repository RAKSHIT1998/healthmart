import {
  MargIntegrationMode,
  MargSyncEntity,
  MargSyncStatus,
  getDefaultMedicineImage,
  type MargMedicinePayload,
  type MargStockPayload,
  type MargSupplierPayload,
} from '@buymedicines/shared';
import {
  batchRepository,
  branchRepository,
  inventoryRepository,
  manufacturerRepository,
  medicineRepository,
  supplierRepository,
} from '../repositories';
import { CategoryModel, MargSyncLogModel, type IMargSyncLog } from '../models';
import { getMargAdapter } from '../integrations/marg/margAdapterFactory';
import { MargCsvAdapter } from '../integrations/marg/MargCsvAdapter';
import type { IMargAdapter } from '../integrations/marg/IMargAdapter';
import { env } from '../config/env';
import { slugify } from '../utils/slugify';
import { logger } from '../config/logger';

async function getOrCreateDefaultCategory() {
  const slug = 'general-marg-sync';
  let category = await CategoryModel.findOne({ slug });
  if (!category) {
    category = await CategoryModel.create({
      name: 'General',
      slug,
      group: 'medicine',
      isActive: true,
    });
  }
  return category;
}

export interface SyncResult {
  processed: number;
  failed: number;
  errors: string[];
}

export async function applyMedicinePayloads(payloads: MargMedicinePayload[]): Promise<SyncResult> {
  const result: SyncResult = { processed: 0, failed: 0, errors: [] };
  const defaultCategory = await getOrCreateDefaultCategory();

  for (const payload of payloads) {
    try {
      const existing = await medicineRepository.findByMargItemCode(payload.margItemCode);

      if (existing) {
        existing.mrp = payload.mrp;
        existing.sellingPrice = payload.sellingPrice;
        existing.gstPercentage = payload.gstPercentage;
        if (payload.hsnCode) existing.hsnCode = payload.hsnCode;
        if (payload.packSize) existing.packSize = payload.packSize;
        await existing.save();
      } else {
        const manufacturer = payload.manufacturer
          ? await manufacturerRepository.findOrCreateByName(payload.manufacturer)
          : null;

        await medicineRepository.create({
          name: payload.name,
          slug: `${slugify(payload.name)}-${payload.margItemCode.toLowerCase()}`,
          description: payload.composition || payload.name,
          composition: payload.composition ? [payload.composition] : [],
          manufacturerId: manufacturer?._id ?? (await manufacturerRepository.findOrCreateByName('Unknown'))._id,
          categoryId: defaultCategory._id,
          categoryGroup: 'medicine',
          medicineType: 'tablet',
          scheduleClass: 'none',
          prescriptionRequired: false,
          mrp: payload.mrp,
          sellingPrice: payload.sellingPrice,
          gstPercentage: payload.gstPercentage,
          hsnCode: payload.hsnCode || '3004',
          packSize: payload.packSize || 'N/A',
          images: [getDefaultMedicineImage('tablet', 'medicine')],
          margItemCode: payload.margItemCode,
        } as never);
      }
      result.processed += 1;
    } catch (err) {
      result.failed += 1;
      result.errors.push(`${payload.margItemCode}: ${(err as Error).message}`);
    }
  }

  return result;
}

export async function applyStockPayloads(payloads: MargStockPayload[]): Promise<SyncResult> {
  const result: SyncResult = { processed: 0, failed: 0, errors: [] };
  const branch = (await branchRepository.findMainBranch()) ?? (await branchRepository.find({}))[0];

  if (!branch) {
    result.errors.push('No branch configured to receive stock sync');
    return result;
  }

  const touchedMedicineIds = new Set<string>();

  for (const payload of payloads) {
    try {
      const medicine = await medicineRepository.findByMargItemCode(payload.margItemCode);
      if (!medicine) {
        result.failed += 1;
        result.errors.push(`${payload.margItemCode}: medicine not found, sync medicines before stock`);
        continue;
      }

      const margBatchRef = `${payload.margItemCode}:${payload.batchNumber}`;
      const existingBatch = await batchRepository.findByMargBatchRef(margBatchRef);
      const expiryDate = new Date(payload.expiryDate);

      if (existingBatch) {
        existingBatch.quantityRemaining = payload.quantity;
        existingBatch.expiryDate = expiryDate;
        if (payload.costPrice) existingBatch.costPrice = payload.costPrice;
        await existingBatch.save();
      } else {
        await batchRepository.create({
          medicineId: medicine._id,
          branchId: branch._id,
          batchNumber: payload.batchNumber,
          expiryDate,
          quantityReceived: payload.quantity,
          quantityRemaining: payload.quantity,
          costPrice: payload.costPrice ?? 0,
          margBatchRef,
        } as never);
      }

      touchedMedicineIds.add(String(medicine._id));
      result.processed += 1;
    } catch (err) {
      result.failed += 1;
      result.errors.push(`${payload.margItemCode}: ${(err as Error).message}`);
    }
  }

  // Marg is the source of truth for physical stock — recompute each touched medicine's
  // total from the sum of its batches rather than incrementing, to avoid drift.
  for (const medicineId of touchedMedicineIds) {
    const batches = await batchRepository.find({ medicineId, branchId: branch._id });
    const total = batches.reduce((sum, b) => sum + b.quantityRemaining, 0);
    await inventoryRepository.setTotalQuantity(medicineId, String(branch._id), total);
  }

  return result;
}

export async function applySupplierPayloads(payloads: MargSupplierPayload[]): Promise<SyncResult> {
  const result: SyncResult = { processed: 0, failed: 0, errors: [] };

  for (const payload of payloads) {
    try {
      const existing = await supplierRepository.findByMargCode(payload.margSupplierCode);
      if (existing) {
        Object.assign(existing, {
          name: payload.name,
          gstin: payload.gstin,
          contactPerson: payload.contactPerson,
          phone: payload.phone,
          email: payload.email,
          address: payload.address,
        });
        await existing.save();
      } else {
        await supplierRepository.create({ ...payload, margSupplierCode: payload.margSupplierCode } as never);
      }
      result.processed += 1;
    } catch (err) {
      result.failed += 1;
      result.errors.push(`${payload.margSupplierCode}: ${(err as Error).message}`);
    }
  }

  return result;
}

/**
 * Customer records from Marg are logged but not auto-imported as website
 * accounts — creating login-capable User records from ERP ledger data without
 * the customer's consent/OTP verification would be a privacy and security
 * problem. Matching against existing accounts happens by phone number at
 * checkout/order-sync time instead.
 */
async function applyCustomerPayloadsLogOnly(count: number): Promise<SyncResult> {
  return { processed: count, failed: 0, errors: [] };
}

async function runEntitySync(entity: MargSyncEntity, triggeredBy?: string, adapterOverride?: IMargAdapter): Promise<IMargSyncLog> {
  const adapter = adapterOverride ?? getMargAdapter();
  const log = await MargSyncLogModel.create({
    entity,
    mode: adapterOverride ? MargIntegrationMode.CSV : env.MARG_INTEGRATION_MODE,
    status: MargSyncStatus.RUNNING,
    triggeredBy,
  });

  try {
    let result: SyncResult;

    switch (entity) {
      case MargSyncEntity.MEDICINE:
      case MargSyncEntity.PRICE: {
        const payloads = await adapter.pullMedicines();
        result = await applyMedicinePayloads(payloads);
        break;
      }
      case MargSyncEntity.STOCK:
      case MargSyncEntity.BATCH: {
        const payloads = await adapter.pullStock();
        result = await applyStockPayloads(payloads);
        break;
      }
      case MargSyncEntity.SUPPLIER: {
        const payloads = await adapter.pullSuppliers();
        result = await applySupplierPayloads(payloads);
        break;
      }
      case MargSyncEntity.CUSTOMER: {
        const payloads = await adapter.pullCustomers();
        result = await applyCustomerPayloadsLogOnly(payloads.length);
        break;
      }
      default:
        result = { processed: 0, failed: 0, errors: [`Unsupported sync entity: ${entity}`] };
    }

    log.recordsProcessed = result.processed;
    log.recordsFailed = result.failed;
    log.errorMessages = result.errors;
    log.status = result.failed === 0 ? MargSyncStatus.SUCCESS : result.processed > 0 ? MargSyncStatus.PARTIAL : MargSyncStatus.FAILED;
  } catch (err) {
    logger.error({ err, entity }, 'MARG sync run failed');
    log.status = MargSyncStatus.FAILED;
    log.errorMessages = [(err as Error).message];
  }

  log.finishedAt = new Date();
  await log.save();
  return log;
}

export async function runFullSync(triggeredBy?: string): Promise<IMargSyncLog[]> {
  const entities = [MargSyncEntity.MEDICINE, MargSyncEntity.STOCK, MargSyncEntity.SUPPLIER, MargSyncEntity.CUSTOMER];
  const logs: IMargSyncLog[] = [];
  for (const entity of entities) {
    logs.push(await runEntitySync(entity, triggeredBy));
  }
  return logs;
}

export async function runSyncForEntity(entity: MargSyncEntity, triggeredBy?: string): Promise<IMargSyncLog> {
  return runEntitySync(entity, triggeredBy);
}

/**
 * Runs a sync straight off an admin-uploaded CSV/XLSX file, independent of
 * MARG_INTEGRATION_MODE — a manual upload is a deliberate one-off action and
 * should work even when the scheduled cron pull is disabled.
 */
export async function runSyncFromUpload(entity: MargSyncEntity, triggeredBy?: string): Promise<IMargSyncLog> {
  return runEntitySync(entity, triggeredBy, new MargCsvAdapter());
}

export { MargIntegrationMode };
