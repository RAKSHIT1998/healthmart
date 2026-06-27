import cron from 'node-cron';
import { MargIntegrationMode } from '@healthmart/shared';
import { env } from '../config/env';
import { runFullSync } from '../services/margSync.service';
import { logger } from '../config/logger';

/** Runs the configured MARG_SYNC_CRON schedule when integration mode is csv or api (webhook mode is push-only, nothing to poll). */
export function startMargSyncJob(): void {
  if (env.MARG_INTEGRATION_MODE !== MargIntegrationMode.CSV && env.MARG_INTEGRATION_MODE !== MargIntegrationMode.API) {
    logger.info(`MARG sync cron not started (mode=${env.MARG_INTEGRATION_MODE})`);
    return;
  }

  cron.schedule(env.MARG_SYNC_CRON, async () => {
    logger.info('Running scheduled MARG sync...');
    try {
      const logs = await runFullSync();
      logger.info({ summary: logs.map((l) => ({ entity: l.entity, status: l.status, processed: l.recordsProcessed })) }, 'MARG sync complete');
    } catch (err) {
      logger.error({ err }, 'Scheduled MARG sync failed');
    }
  });
}
