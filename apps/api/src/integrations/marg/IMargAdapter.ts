import type {
  MargCustomerPayload,
  MargMedicinePayload,
  MargReturnPush,
  MargSaleInvoicePush,
  MargStockPayload,
  MargSupplierPayload,
} from '@healthmart/shared';

export interface MargPushResult {
  success: boolean;
  margRef?: string;
  message?: string;
}

/**
 * Every Marg integration mode (CSV import, webhook receiver, or a future direct
 * API client) implements this contract. MargSyncService only ever talks to this
 * interface, so switching `MARG_INTEGRATION_MODE` is a one-line config change —
 * no call site in the rest of the application needs to change.
 */
export interface IMargAdapter {
  pullMedicines(): Promise<MargMedicinePayload[]>;
  pullStock(): Promise<MargStockPayload[]>;
  pullSuppliers(): Promise<MargSupplierPayload[]>;
  pullCustomers(): Promise<MargCustomerPayload[]>;
  pushSaleInvoice(payload: MargSaleInvoicePush): Promise<MargPushResult>;
  pushReturn(payload: MargReturnPush): Promise<MargPushResult>;
}
