import { logger } from '../../config/logger';
import type { IMargAdapter, MargPushResult } from './IMargAdapter';

/**
 * Webhook mode is push-only: Marg (or a middleware relaying its data) calls
 * `POST /api/v1/marg/webhook` and the controller maps + applies records
 * immediately via margWebhookMapper + MargSyncService — it does not go
 * through pull(). These methods exist only so the scheduled sync job and the
 * factory can treat every mode uniformly; they intentionally no-op for pulls
 * and report push as unsupported until a direct API is configured.
 */
export class MargWebhookAdapter implements IMargAdapter {
  async pullMedicines() {
    logger.debug('MargWebhookAdapter.pullMedicines is a no-op; data arrives via POST /marg/webhook');
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
    return {
      success: false,
      message:
        'Webhook-receiver mode has no outbound channel to Marg. Set MARG_INTEGRATION_MODE=api once direct API credentials are available.',
    };
  }

  async pushReturn(): Promise<MargPushResult> {
    return {
      success: false,
      message:
        'Webhook-receiver mode has no outbound channel to Marg. Set MARG_INTEGRATION_MODE=api once direct API credentials are available.',
    };
  }
}
