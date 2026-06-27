import { startReservationReleaseJob } from './reservationRelease.job';
import { startMargSyncJob } from './margSync.job';
import { startExpiryAlertJob } from './expiryAlert.job';
import { startAnalyticsSnapshotJob } from './analyticsSnapshot.job';
import { logger } from '../config/logger';

export function startAllCronJobs(): void {
  startReservationReleaseJob();
  startMargSyncJob();
  startExpiryAlertJob();
  startAnalyticsSnapshotJob();
  logger.info('Cron jobs scheduled: reservation-release, marg-sync, expiry-alert, analytics-snapshot');
}
