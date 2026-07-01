import fs from 'fs';
import path from 'path';
import type {
  MargCustomerPayload,
  MargMedicinePayload,
  MargReturnPush,
  MargSaleInvoicePush,
  MargStockPayload,
  MargSupplierPayload,
} from '@buymedicines/shared';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import type { IMargAdapter, MargPushResult } from './IMargAdapter';
import { ensureDir, findLatestFile, moveToProcessed, readTabularFile, type FileRow } from './fileReader';

function num(row: FileRow, ...keys: string[]): number {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== '') return Number(row[key]);
  }
  return 0;
}

function str(row: FileRow, ...keys: string[]): string | undefined {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== '') return String(row[key]).trim();
  }
  return undefined;
}

/**
 * Reads Marg ERP's flat-file exports (CSV/XLSX) from MARG_CSV_WATCH_DIR. Column
 * names below match Marg's common "Item Master" / "Stock Statement" / "Ledger
 * Master" export layouts; adjust the `str()`/`num()` key lists here if a
 * specific Marg installation exports different headers — no other code needs
 * to change since MargSyncService only depends on IMargAdapter.
 */
export class MargCsvAdapter implements IMargAdapter {
  private readonly watchDir = path.resolve(env.MARG_CSV_WATCH_DIR);
  private readonly processedDir = path.resolve(env.MARG_CSV_PROCESSED_DIR);
  private readonly outgoingDir = path.resolve(this.watchDir, '..', 'outgoing');

  async pullMedicines(): Promise<MargMedicinePayload[]> {
    const file = findLatestFile(this.watchDir, 'medicine');
    if (!file) {
      logger.warn(`No medicine export file found in ${this.watchDir}`);
      return [];
    }

    const rows = readTabularFile(file);
    const payloads: MargMedicinePayload[] = rows
      .map((row) => ({
        margItemCode: str(row, 'ItemCode', 'item_code', 'ItemCD') ?? '',
        name: str(row, 'ItemName', 'item_name', 'Name') ?? '',
        composition: str(row, 'Composition', 'Salt', 'Formula'),
        manufacturer: str(row, 'Manufacturer', 'Company', 'CompanyName'),
        hsnCode: str(row, 'HSNCode', 'HSN', 'HsnCode'),
        mrp: num(row, 'MRP', 'Mrp'),
        sellingPrice: num(row, 'SalesRate', 'SellingPrice', 'Rate'),
        gstPercentage: num(row, 'GST', 'GSTPercent', 'TaxPercent'),
        packSize: str(row, 'PackSize', 'Pack', 'Unit'),
      }))
      .filter((p) => p.margItemCode && p.name);

    moveToProcessed(file, this.processedDir);
    return payloads;
  }

  async pullStock(): Promise<MargStockPayload[]> {
    const file = findLatestFile(this.watchDir, 'stock');
    if (!file) {
      logger.warn(`No stock export file found in ${this.watchDir}`);
      return [];
    }

    const rows = readTabularFile(file);
    const payloads: MargStockPayload[] = rows
      .map((row) => ({
        margItemCode: str(row, 'ItemCode', 'item_code', 'ItemCD') ?? '',
        branchCode: str(row, 'BranchCode', 'Branch', 'GodownCode'),
        batchNumber: str(row, 'BatchNo', 'Batch', 'BatchNumber') ?? '',
        expiryDate: str(row, 'ExpiryDate', 'Expiry', 'ExpDate') ?? '',
        quantity: num(row, 'Qty', 'Quantity', 'ClosingStock'),
        costPrice: num(row, 'CostPrice', 'PurchaseRate', 'Rate') || undefined,
      }))
      .filter((p) => p.margItemCode && p.batchNumber);

    moveToProcessed(file, this.processedDir);
    return payloads;
  }

  async pullSuppliers(): Promise<MargSupplierPayload[]> {
    const file = findLatestFile(this.watchDir, 'supplier');
    if (!file) return [];

    const rows = readTabularFile(file);
    const payloads: MargSupplierPayload[] = rows
      .map((row) => ({
        margSupplierCode: str(row, 'SupplierCode', 'LedgerCode', 'Code') ?? '',
        name: str(row, 'SupplierName', 'LedgerName', 'Name') ?? '',
        gstin: str(row, 'GSTIN', 'GstNo'),
        contactPerson: str(row, 'ContactPerson', 'Contact'),
        phone: str(row, 'Phone', 'Mobile'),
        email: str(row, 'Email'),
        address: str(row, 'Address'),
      }))
      .filter((p) => p.margSupplierCode && p.name);

    moveToProcessed(file, this.processedDir);
    return payloads;
  }

  async pullCustomers(): Promise<MargCustomerPayload[]> {
    const file = findLatestFile(this.watchDir, 'customer');
    if (!file) return [];

    const rows = readTabularFile(file);
    const payloads: MargCustomerPayload[] = rows
      .map((row) => ({
        margCustomerCode: str(row, 'CustomerCode', 'LedgerCode', 'Code') ?? '',
        name: str(row, 'CustomerName', 'LedgerName', 'Name') ?? '',
        phone: str(row, 'Phone', 'Mobile'),
        email: str(row, 'Email'),
      }))
      .filter((p) => p.margCustomerCode && p.name);

    moveToProcessed(file, this.processedDir);
    return payloads;
  }

  /**
   * CSV mode has no inbound API to call, so outbound sale data is written as a
   * JSON file Marg can be configured to pick up via its own import routine.
   */
  async pushSaleInvoice(payload: MargSaleInvoicePush): Promise<MargPushResult> {
    ensureDir(this.outgoingDir);
    const fileName = `sale-invoice-${payload.invoiceNumber.replace(/[/\\]/g, '_')}.json`;
    fs.writeFileSync(path.join(this.outgoingDir, fileName), JSON.stringify(payload, null, 2));
    return { success: true, margRef: fileName, message: 'Written to outgoing CSV-mode export queue' };
  }

  async pushReturn(payload: MargReturnPush): Promise<MargPushResult> {
    ensureDir(this.outgoingDir);
    const fileName = `return-${payload.orderId}-${Date.now()}.json`;
    fs.writeFileSync(path.join(this.outgoingDir, fileName), JSON.stringify(payload, null, 2));
    return { success: true, margRef: fileName, message: 'Written to outgoing CSV-mode export queue' };
  }
}
