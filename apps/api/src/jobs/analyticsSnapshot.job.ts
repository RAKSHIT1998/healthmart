import cron from 'node-cron';
import { branchRepository } from '../repositories';
import { analyticsRepository } from '../repositories';
import { logger } from '../config/logger';

/** Daily at 00:15: rolls up the previous day's orders into AnalyticsSnapshot for fast historical queries. */
export function startAnalyticsSnapshotJob(): void {
  cron.schedule('15 0 * * *', async () => {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const dateLabel = yesterday.toISOString().slice(0, 10);
      const branches = await branchRepository.find({ isActive: true });

      for (const branch of branches) {
        await analyticsRepository.upsertDailySnapshot(dateLabel, String(branch._id));
      }
      logger.info({ date: dateLabel, branches: branches.length }, 'Analytics snapshot rollup complete');
    } catch (err) {
      logger.error({ err }, 'Analytics snapshot job failed');
    }
  });
}
