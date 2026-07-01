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

/**
 * Direct Marg ERP API client — NOT production-verified. Marg Compusoft does not
 * publish a single public REST spec; on-boarding a client onto "Marg ON" /
 * Marg eRetail API access requires a dealer agreement and per-installation
 * credentials. The endpoint paths and response field names below are best-guess
 * placeholders matching Marg's typical resource naming; once real API
 * documentation/credentials are issued, update `ENDPOINTS` and the response
 * mapping in each method — no other file in the app needs to change, since
 * every caller depends only on IMargAdapter.
 */
const ENDPOINTS = {
  medicines: '/api/items',
  stock: '/api/stock',
  suppliers: '/api/suppliers',
  customers: '/api/customers',
  saleInvoice: '/api/sale-invoice',
  return: '/api/sale-return',
};

export class MargApiAdapter implements IMargAdapter {
  private assertConfigured(): void {
    if (!env.MARG_API_BASE_URL || !env.MARG_API_KEY) {
      throw new Error(
        'MARG_INTEGRATION_MODE=api requires MARG_API_BASE_URL and MARG_API_KEY to be set in .env.',
      );
    }
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    this.assertConfigured();
    const response = await fetch(`${env.MARG_API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.MARG_API_KEY}`,
        ...(env.MARG_BRANCH_CODE ? { 'X-Branch-Code': env.MARG_BRANCH_CODE } : {}),
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      logger.error({ path, status: response.status, body }, 'MARG API request failed');
      throw new Error(`MARG API request to ${path} failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  }

  async pullMedicines(): Promise<MargMedicinePayload[]> {
    return this.request<MargMedicinePayload[]>(ENDPOINTS.medicines);
  }

  async pullStock(): Promise<MargStockPayload[]> {
    return this.request<MargStockPayload[]>(ENDPOINTS.stock);
  }

  async pullSuppliers(): Promise<MargSupplierPayload[]> {
    return this.request<MargSupplierPayload[]>(ENDPOINTS.suppliers);
  }

  async pullCustomers(): Promise<MargCustomerPayload[]> {
    return this.request<MargCustomerPayload[]>(ENDPOINTS.customers);
  }

  async pushSaleInvoice(payload: MargSaleInvoicePush): Promise<MargPushResult> {
    try {
      const result = await this.request<{ invoice_ref: string }>(ENDPOINTS.saleInvoice, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return { success: true, margRef: result.invoice_ref };
    } catch (err) {
      return { success: false, message: (err as Error).message };
    }
  }

  async pushReturn(payload: MargReturnPush): Promise<MargPushResult> {
    try {
      const result = await this.request<{ return_ref: string }>(ENDPOINTS.return, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return { success: true, margRef: result.return_ref };
    } catch (err) {
      return { success: false, message: (err as Error).message };
    }
  }
}
