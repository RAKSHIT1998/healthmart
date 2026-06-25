import type { IMargAdapter, MargPushResult } from './IMargAdapter';

/** No-op adapter used when MARG_INTEGRATION_MODE=disabled. */
export class MargDisabledAdapter implements IMargAdapter {
  async pullMedicines() {
    return [];
  }
  async pullStock() {
    return [];
  }
  async pullSuppliers() {
    return [];
  }
  async pullCustomers() {
    return [];
  }
  async pushSaleInvoice(): Promise<MargPushResult> {
    return { success: false, message: 'MARG integration is disabled' };
  }
  async pushReturn(): Promise<MargPushResult> {
    return { success: false, message: 'MARG integration is disabled' };
  }
}
