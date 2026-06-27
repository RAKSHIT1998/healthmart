import { appointmentRepository, orderRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import { confirmOrderPlacement, handlePaymentFailure } from './order.service';
import { confirmAppointmentPayment, failAppointmentPayment } from './appointment.service';
import { logger } from '../config/logger';

interface CashfreeWebhookPayload {
  type: string;
  data: {
    order?: { order_id?: string; order_status?: string };
    payment?: { payment_status?: string };
  };
}

const SUCCESS_STATUSES = new Set(['PAID', 'SUCCESS']);
const FAILURE_STATUSES = new Set(['FAILED', 'EXPIRED', 'CANCELLED', 'USER_DROPPED']);

/** Cashfree order IDs are prefixed at creation time (`MMS-...` for pharmacy orders, `APT-...` for appointments) so one webhook can route to the right domain without an extra lookup table. */
export async function processCashfreeWebhook(payload: CashfreeWebhookPayload): Promise<void> {
  const cfOrderId = payload.data.order?.order_id;
  if (!cfOrderId) {
    logger.warn({ payload }, 'Cashfree webhook missing order_id');
    return;
  }

  const status = (payload.data.order?.order_status || payload.data.payment?.payment_status || '').toUpperCase();
  const isSuccess = SUCCESS_STATUSES.has(status);
  const isFailure = FAILURE_STATUSES.has(status);

  if (!isSuccess && !isFailure) {
    logger.info({ cfOrderId, status }, 'Cashfree webhook received with non-terminal status');
    return;
  }

  if (cfOrderId.startsWith('APT-')) {
    const appointment = await appointmentRepository.findByCashfreeOrderId(cfOrderId);
    if (!appointment) {
      logger.warn({ cfOrderId }, 'Cashfree webhook references unknown appointment');
      return;
    }
    if (isSuccess) await confirmAppointmentPayment(String(appointment._id));
    else await failAppointmentPayment(String(appointment._id));
    return;
  }

  const order = await orderRepository.findByCashfreeOrderId(cfOrderId);
  if (!order) {
    logger.warn({ cfOrderId }, 'Cashfree webhook references unknown order');
    return;
  }
  if (isSuccess) await confirmOrderPlacement(String(order._id));
  else await handlePaymentFailure(String(order._id));
}

export async function getOrderPaymentStatus(orderId: string) {
  const order = await orderRepository.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  return { status: order.status, paymentStatus: order.paymentStatus };
}
