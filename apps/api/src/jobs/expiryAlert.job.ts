import cron from 'node-cron';
import { EXPIRY_ALERT_WINDOW_DAYS, NotificationType, Role } from '@healthmart/shared';
import { batchRepository } from '../repositories';
import { UserModel } from '../models';
import { notifyUser } from '../services/notification.service';
import { logger } from '../config/logger';

/** Daily at 7am: notifies Admin/Manager/Inventory Manager staff about batches nearing expiry. */
export function startExpiryAlertJob(): void {
  cron.schedule('0 7 * * *', async () => {
    try {
      const expiring = await batchRepository.findExpiringSoon(undefined, EXPIRY_ALERT_WINDOW_DAYS);
      if (expiring.length === 0) return;

      const staff = await UserModel.find({
        role: { $in: [Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER] },
        isActive: true,
      });

      for (const member of staff) {
        await notifyUser({
          userId: String(member._id),
          type: NotificationType.SYSTEM,
          title: 'Expiry alert',
          message: `${expiring.length} batch(es) are expiring within ${EXPIRY_ALERT_WINDOW_DAYS} days. Review the inventory expiry report.`,
        });
      }
    } catch (err) {
      logger.error({ err }, 'Expiry alert job failed');
    }
  });
}
