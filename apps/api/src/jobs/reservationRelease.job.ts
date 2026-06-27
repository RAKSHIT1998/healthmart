import cron from 'node-cron';
import { orderRepository } from '../repositories';
import { handlePaymentFailure } from '../services/order.service';
import { logger } from '../config/logger';

/** Every minute, cancels pending_payment orders whose stock-reservation hold has expired and releases the stock. */
export function startReservationReleaseJob(): void {
  cron.schedule('* * * * *', async () => {
    try {
      const expired = await orderRepository.findExpiredReservations();
      for (const order of expired) {
        await handlePaymentFailure(String(order._id));
        logger.info({ orderId: order._id, orderNumber: order.orderNumber }, 'Released expired stock reservation');
      }
    } catch (err) {
      logger.error({ err }, 'Reservation release job failed');
    }
  });
}
