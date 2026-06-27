import { startReservationReleaseJob } from './reservationRelease.job';
import { startMargSyncJob } from './margSync.job';
import { startExpiryAlertJob } from './expiryAlert.job';
import { startAnalyticsSnapshotJob } from './analyticsSnapshot.job';
import { startAppointmentPaymentReleaseJob } from './appointmentPaymentRelease.job';
import { logger } from '../config/logger';

export function startAllCronJobs(): void {
  startReservationReleaseJob();
  startMargSyncJob();
  startExpiryAlertJob();
  startAnalyticsSnapshotJob();
  startAppointmentPaymentReleaseJob();
  logger.info(
    'Cron jobs scheduled: reservation-release, marg-sync, expiry-alert, analytics-snapshot, appointment-payment-release',
  );
}
