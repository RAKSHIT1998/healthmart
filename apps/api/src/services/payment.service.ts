import { orderRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import { confirmOrderPlacement, handlePaymentFailure } from './order.service';
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

export async function processCashfreeWebhook(payload: CashfreeWebhookPayload): Promise<void> {
  const cfOrderId = payload.data.order?.order_id;
  if (!cfOrderId) {
    logger.warn({ payload }, 'Cashfree webhook missing order_id');
    return;
  }

  const order = await orderRepository.findByCashfreeOrderId(cfOrderId);
  if (!order) {
    logger.warn({ cfOrderId }, 'Cashfree webhook references unknown order');
    return;
  }

  const status = payload.data.order?.order_status || payload.data.payment?.payment_status || '';

  if (SUCCESS_STATUSES.has(status.toUpperCase())) {
    await confirmOrderPlacement(String(order._id));
  } else if (FAILURE_STATUSES.has(status.toUpperCase())) {
    await handlePaymentFailure(String(order._id));
  } else {
    logger.info({ cfOrderId, status }, 'Cashfree webhook received with non-terminal status');
  }
}

export async function getOrderPaymentStatus(orderId: string) {
  const order = await orderRepository.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  return { status: order.status, paymentStatus: order.paymentStatus };
}
