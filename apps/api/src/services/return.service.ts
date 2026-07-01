import {
  NotificationChannel,
  NotificationType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  RefundMethod,
  RETURN_WINDOW_DAYS,
  ReturnStatus,
  WalletTransactionReason,
  type CreateReturnRequestInput,
} from '@buymedicines/shared';
import { orderRepository, returnRequestRepository } from '../repositories';
import { InventoryMovementModel } from '../models';
import { InventoryMovementType } from '@buymedicines/shared';
import { ApiError } from '../utils/ApiError';
import { inventoryRepository } from '../repositories/inventory.repository';
import { creditWallet } from './wallet.service';
import { notifyUser } from './notification.service';
import { initiateCashfreeRefund } from '../integrations/cashfree';
import { generateRefundId } from './order.service';

export async function createReturnRequest(userId: string, input: CreateReturnRequestInput) {
  const order = await orderRepository.findOne({ _id: input.orderId, userId });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.status !== OrderStatus.DELIVERED || !order.deliveredAt) {
    throw ApiError.badRequest('Only delivered orders are eligible for return');
  }

  const windowEndMs = order.deliveredAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  if (Date.now() > windowEndMs) {
    throw ApiError.badRequest(`The ${RETURN_WINDOW_DAYS}-day return window for this order has expired`);
  }

  const items: Array<{ medicineId: string; name: string; quantity: number; sellingPrice: number; gstPercentage: number }> = [];
  let refundAmount = 0;

  for (const requested of input.items) {
    const orderItem = order.items.find((i) => String(i.medicineId) === requested.medicineId);
    if (!orderItem) throw ApiError.badRequest('One of the selected items is not part of this order');
    if (orderItem.prescriptionRequired) {
      throw ApiError.badRequest(`${orderItem.name} is a prescription medicine and cannot be returned once delivered`);
    }

    const alreadyRequested = await returnRequestRepository.getReturnedQuantity(String(order._id), requested.medicineId);
    const eligible = orderItem.quantity - alreadyRequested;
    if (requested.quantity > eligible) {
      throw ApiError.badRequest(`Only ${Math.max(0, eligible)} unit(s) of ${orderItem.name} are eligible for return`);
    }

    // sellingPrice is GST-inclusive (matches cart/order total computation) — refund is the price
    // actually paid for the returned units; delivery fee and any order-level coupon discount are
    // not pro-rated back on partial returns.
    items.push({
      medicineId: requested.medicineId,
      name: orderItem.name,
      quantity: requested.quantity,
      sellingPrice: orderItem.sellingPrice,
      gstPercentage: orderItem.gstPercentage,
    });
    refundAmount += orderItem.sellingPrice * requested.quantity;
  }

  const returnRequest = await returnRequestRepository.create({
    orderId: order._id,
    userId,
    branchId: order.branchId,
    items,
    reasonCategory: input.reasonCategory,
    reason: input.reason,
    refundAmount: Math.round(refundAmount * 100) / 100,
    status: ReturnStatus.REQUESTED,
  } as never);

  await notifyUser({
    userId,
    type: NotificationType.ORDER_UPDATE,
    title: 'Return request submitted',
    message: `We've received your return request for order ${order.orderNumber}. We'll review it shortly.`,
    channels: [NotificationChannel.IN_APP],
  });

  return returnRequest;
}

export async function listMyReturns(userId: string, page: number, limit: number) {
  return returnRequestRepository.listForUser(userId, page, limit);
}

export async function listPendingReturns(page: number, limit: number) {
  return returnRequestRepository.listPending(page, limit);
}

export async function listAllReturns(status: string | undefined, page: number, limit: number) {
  return returnRequestRepository.listAll(status, page, limit);
}

export async function approveReturn(returnId: string, processedBy: string, refundMethod: RefundMethod) {
  const returnRequest = await returnRequestRepository.findById(returnId);
  if (!returnRequest) throw ApiError.notFound('Return request not found');
  if (returnRequest.status !== ReturnStatus.REQUESTED) {
    throw ApiError.badRequest('This return request has already been processed');
  }

  const order = await orderRepository.findById(String(returnRequest.orderId));
  if (!order) throw ApiError.notFound('Associated order not found');

  for (const item of returnRequest.items) {
    await inventoryRepository.addStock(String(item.medicineId), String(returnRequest.branchId), item.quantity);
    await InventoryMovementModel.create({
      medicineId: item.medicineId,
      branchId: returnRequest.branchId,
      type: InventoryMovementType.RETURN,
      quantity: item.quantity,
      referenceType: 'ReturnRequest',
      referenceId: returnRequest._id,
      createdBy: processedBy,
    });
  }

  const refundId = generateRefundId();
  if (refundMethod === RefundMethod.ORIGINAL_PAYMENT && order.paymentMethod === PaymentMethod.CASHFREE && order.cashfreeOrderId) {
    await initiateCashfreeRefund(order.cashfreeOrderId, returnRequest.refundAmount, refundId);
    if (order.paymentStatus === PaymentStatus.PAID) order.paymentStatus = PaymentStatus.PARTIALLY_REFUNDED;
    await order.save();
  } else {
    // COD orders, wallet-paid orders, and any explicit "refund to wallet" choice all settle here —
    // there's no original payment instrument to reverse a cash transaction against.
    await creditWallet(String(returnRequest.userId), returnRequest.refundAmount, WalletTransactionReason.REFUND, String(returnRequest._id));
  }

  returnRequest.status = ReturnStatus.REFUNDED;
  returnRequest.refundMethod = refundMethod;
  returnRequest.processedBy = processedBy as never;
  returnRequest.processedAt = new Date();
  await returnRequest.save();

  await notifyUser({
    userId: String(returnRequest.userId),
    type: NotificationType.ORDER_UPDATE,
    title: 'Return approved & refunded',
    message: `Your return for order ${order.orderNumber} has been approved and ₹${returnRequest.refundAmount} has been refunded.`,
    channels: [NotificationChannel.IN_APP, NotificationChannel.SMS],
  });

  return returnRequest;
}

export async function rejectReturn(returnId: string, processedBy: string, rejectionReason: string | undefined) {
  const returnRequest = await returnRequestRepository.findById(returnId);
  if (!returnRequest) throw ApiError.notFound('Return request not found');
  if (returnRequest.status !== ReturnStatus.REQUESTED) {
    throw ApiError.badRequest('This return request has already been processed');
  }

  returnRequest.status = ReturnStatus.REJECTED;
  returnRequest.rejectionReason = rejectionReason;
  returnRequest.processedBy = processedBy as never;
  returnRequest.processedAt = new Date();
  await returnRequest.save();

  const order = await orderRepository.findById(String(returnRequest.orderId));
  await notifyUser({
    userId: String(returnRequest.userId),
    type: NotificationType.ORDER_UPDATE,
    title: 'Return request rejected',
    message: `Your return request for order ${order?.orderNumber ?? ''} was rejected. ${rejectionReason ?? ''}`.trim(),
    channels: [NotificationChannel.IN_APP, NotificationChannel.SMS],
  });

  return returnRequest;
}
