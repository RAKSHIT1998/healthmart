import type {
  MargCustomerPayload,
  MargMedicinePayload,
  MargSupplierPayload,
  MargStockPayload,
} from '@healthmart/shared';

type RawRecord = Record<string, unknown>;

function str(record: RawRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== '') return String(value).trim();
  }
  return undefined;
}

function num(record: RawRecord, ...keys: string[]): number {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== '') return Number(value);
  }
  return 0;
}

/**
 * Maps a single raw webhook record into the canonical Marg payload shapes.
 * Assumes the relaying system (Marg Compusoft or a middleware) sends field
 * names consistent with Marg's standard export schema — the same key set the
 * CSV adapter recognizes (see MargCsvAdapter). Used directly by the webhook
 * controller, one record at a time, before handing off to MargSyncService.
 */
export const margWebhookMapper = {
  toMedicine(record: RawRecord): MargMedicinePayload | null {
    const margItemCode = str(record, 'margItemCode', 'ItemCode', 'item_code');
    const name = str(record, 'name', 'ItemName', 'item_name');
    if (!margItemCode || !name) return null;

    return {
      margItemCode,
      name,
      composition: str(record, 'composition', 'Composition', 'Salt'),
      manufacturer: str(record, 'manufacturer', 'Manufacturer', 'Company'),
      hsnCode: str(record, 'hsnCode', 'HSNCode', 'HSN'),
      mrp: num(record, 'mrp', 'MRP'),
      sellingPrice: num(record, 'sellingPrice', 'SalesRate', 'SellingPrice'),
      gstPercentage: num(record, 'gstPercentage', 'GST', 'GSTPercent'),
      packSize: str(record, 'packSize', 'PackSize', 'Pack'),
    };
  },

  toStock(record: RawRecord): MargStockPayload | null {
    const margItemCode = str(record, 'margItemCode', 'ItemCode', 'item_code');
    const batchNumber = str(record, 'batchNumber', 'BatchNo', 'Batch');
    if (!margItemCode || !batchNumber) return null;

    return {
      margItemCode,
      branchCode: str(record, 'branchCode', 'BranchCode', 'Branch'),
      batchNumber,
      expiryDate: str(record, 'expiryDate', 'ExpiryDate', 'Expiry') ?? '',
      quantity: num(record, 'quantity', 'Qty', 'Quantity'),
      costPrice: num(record, 'costPrice', 'CostPrice', 'PurchaseRate') || undefined,
    };
  },

  toSupplier(record: RawRecord): MargSupplierPayload | null {
    const margSupplierCode = str(record, 'margSupplierCode', 'SupplierCode', 'LedgerCode');
    const name = str(record, 'name', 'SupplierName', 'LedgerName');
    if (!margSupplierCode || !name) return null;

    return {
      margSupplierCode,
      name,
      gstin: str(record, 'gstin', 'GSTIN'),
      contactPerson: str(record, 'contactPerson', 'ContactPerson'),
      phone: str(record, 'phone', 'Phone', 'Mobile'),
      email: str(record, 'email', 'Email'),
      address: str(record, 'address', 'Address'),
    };
  },

  toCustomer(record: RawRecord): MargCustomerPayload | null {
    const margCustomerCode = str(record, 'margCustomerCode', 'CustomerCode', 'LedgerCode');
    const name = str(record, 'name', 'CustomerName', 'LedgerName');
    if (!margCustomerCode || !name) return null;

    return {
      margCustomerCode,
      name,
      phone: str(record, 'phone', 'Phone', 'Mobile'),
      email: str(record, 'email', 'Email'),
    };
  },
};
