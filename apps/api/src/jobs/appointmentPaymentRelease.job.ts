import cron from 'node-cron';
import { AppointmentStatus, CHECKOUT_CONFIG, PaymentStatus } from '@healthmart/shared';
import { appointmentRepository } from '../repositories';
import { logger } from '../config/logger';

/** Every minute, cancels appointment bookings stuck in pending_payment past the hold window — frees the slot for someone else, mirroring the inventory reservation release job. */
export function startAppointmentPaymentReleaseJob(): void {
  cron.schedule('* * * * *', async () => {
    try {
      const cutoff = new Date(Date.now() - CHECKOUT_CONFIG.RESERVATION_HOLD_MINUTES * 60 * 1000);
      const stale = await appointmentRepository.find({
        status: AppointmentStatus.PENDING_PAYMENT,
        createdAt: { $lte: cutoff },
      });

      for (const appointment of stale) {
        appointment.status = AppointmentStatus.CANCELLED;
        appointment.paymentStatus = PaymentStatus.FAILED;
        appointment.cancellationReason = 'Payment not completed in time';
        await appointment.save();
        logger.info({ appointmentId: appointment._id }, 'Released expired appointment slot hold');
      }
    } catch (err) {
      logger.error({ err }, 'Appointment payment release job failed');
    }
  });
}
