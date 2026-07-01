import { MargIntegrationMode } from '@buymedicines/shared';
import { env } from '../../config/env';
import type { IMargAdapter } from './IMargAdapter';
import { MargCsvAdapter } from './MargCsvAdapter';
import { MargWebhookAdapter } from './MargWebhookAdapter';
import { MargApiAdapter } from './MargApiAdapter';
import { MargDisabledAdapter } from './MargDisabledAdapter';

let cachedAdapter: IMargAdapter | null = null;

/**
 * Single switch point for the entire MARG integration. Changing
 * MARG_INTEGRATION_MODE in `.env` is the only step required to move from
 * CSV import to webhook receiving to a direct API — every service depends on
 * IMargAdapter, never on a concrete class.
 */
export function getMargAdapter(): IMargAdapter {
  if (cachedAdapter) return cachedAdapter;

  switch (env.MARG_INTEGRATION_MODE) {
    case MargIntegrationMode.CSV:
      cachedAdapter = new MargCsvAdapter();
      break;
    case MargIntegrationMode.WEBHOOK:
      cachedAdapter = new MargWebhookAdapter();
      break;
    case MargIntegrationMode.API:
      cachedAdapter = new MargApiAdapter();
      break;
    default:
      cachedAdapter = new MargDisabledAdapter();
  }

  return cachedAdapter;
}

export * from './IMargAdapter';
export { margWebhookMapper } from './margWebhookMapper';
