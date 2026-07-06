import crypto from 'crypto';
import {
  CHECKOUT_CONFIG,
  NotificationChannel,
  NotificationType,
  OrderStatus,
  ORDER_STATUS_TRANSITIONS,
  PaymentMethod,
  PaymentStatus,
  WalletTransactionReason,
  type CheckoutInput,
} from '@buymedicines/shared';
import {
  addressRepository,
  branchRepository,
  cartRepository,
  couponRepository,
  driverRepository,
  orderRepository,
  prescriptionRepository,
} from '../repositories';
import type { IOrder, IOrderItem } from '../models';
import { ApiError } from '../utils/ApiError';
import { generateOrderNumber } from '../utils/slugify';
import { hashToken } from '../utils/jwt';
import { generateOtp } from '../utils/otp';
import { computeCartTotals } from './cart.service';
import * as inventoryService from './inventory.service';
import { recordCouponRedemption } from './coupon.service';
import { creditWallet, debitWallet, getWallet } from './wallet.service';
import { notifyUser } from './notification.service';
import { generateInvoiceForOrder } from './invoice.service';
import { rewardReferralOnFirstDelivery } from './promotions.service';
import { checkServiceability } from './serviceability.service';
import { emitDriverAssigned, emitNewOrderAlert, emitOrderStatus } from '../realtime/socket';
import { createCashfreeOrder, initiateCashfreeRefund } from '../integrations/cashfree';
import { getMargAdapter } from '../integrations/marg/margAdapterFactory';
import { getDrivingDistance } from '../integrations/googleMaps';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { MargSyncStatus } from '@buymedicines/shared';
import { DriverModel, MargSyncLogModel } from '../models';
import { sendOtpSms } from '../integrations/msg91';

async function assertNoPrescriptionGate(prescriptionIds: string[], requiresPrescription: boolean): Promise<void> {
  if (!requiresPrescription) return;
  if (prescriptionIds.length === 0) {
    throw ApiError.badRequest('This order contains prescription-only medicines. Please upload a valid prescription.');
  }
}

export async function initiateCheckout(userId: string, input: CheckoutInput, returnUrl: string) {
  const [cart, address, branch] = await Promise.all([
    cartRepository.findByUser(userId),
    addressRepository.findOne({ _id: input.addressId, userId }),
    branchRepository.findMainBranch(),
  ]);

  if (!address) throw ApiError.notFound('Delivery address not found');
  if (!branch) throw ApiError.internal('No active branch configured to fulfil orders');
  if (cart.items.length === 0) throw ApiError.badRequest('Your cart is empty');

  // Fail fast, before any stock is reserved, if nobody can actually deliver to this address yet.
  const serviceability = await checkServiceability(address.pincode);
  if (!serviceability.serviceable) {
    throw ApiError.badRequest(`Sorry, we don't deliver to pincode ${address.pincode} yet.`);
  }

  const totals = await computeCartTotals(cart, userId);
  if (totals.items.length === 0) throw ApiError.badRequest('Your cart has no purchasable items');

  const requiresPrescription = totals.items.some((item) => item.prescriptionRequired);
  await assertNoPrescriptionGate(input.prescriptionIds, requiresPrescription);

  if (input.prescriptionIds.length > 0) {
    const prescriptions = await Promise.all(
      input.prescriptionIds.map((id) => prescriptionRepository.findOne({ _id: id, userId })),
    );
    if (prescriptions.some((p) => !p)) throw ApiError.badRequest('One or more prescriptions could not be found');
  }

  // Reserve stock for every item before money changes hands — this is what prevents overselling.
  await inventoryService.reserveItems(
    totals.items.map((item) => ({
      medicineId: item.medicineId,
      branchId: String(branch._id),
      quantity: item.quantity,
      medicineName: item.name,
    })),
  );

  let walletAmountUsed = 0;
  let totalAmount = totals.totalAmount;

  try {
    if (input.useWalletBalance) {
      const wallet = await getWallet(userId);
      walletAmountUsed = Math.min(wallet.balance, totalAmount);
      totalAmount = Math.round((totalAmount - walletAmountUsed) * 100) / 100;
    }

    const orderItems: IOrderItem[] = await Promise.all(
      totals.items.map(async (item) => ({
        medicineId: item.medicineId as never,
        name: item.name,
        image: item.image,
        variantLabel: item.variantLabel,
        quantity: item.quantity,
        mrp: item.mrp,
        sellingPrice: item.sellingPrice,
        gstPercentage: item.gstPercentage,
        hsnCode: item.hsnCode,
        prescriptionRequired: item.prescriptionRequired,
        batchAllocations: [],
      })),
    );

    const deliveryOtp = generateOtp();
    const order = await orderRepository.create({
      orderNumber: generateOrderNumber(),
      userId,
      branchId: branch._id,
      items: orderItems,
      addressSnapshot: {
        contactName: address.contactName,
        contactPhone: address.contactPhone,
        line1: address.line1,
        line2: address.line2,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        lat: address.lat,
        lng: address.lng,
      },
      deliverySlot: input.deliverySlot,
      paymentMethod: input.paymentMethod,
      paymentStatus: totalAmount === 0 ? PaymentStatus.PAID : PaymentStatus.PENDING,
      status: OrderStatus.PENDING_PAYMENT,
      statusHistory: [{ status: OrderStatus.PENDING_PAYMENT, changedAt: new Date() }],
      // Rough zone-based estimate up front — refined once a driver is actually assigned and
      // their live GPS distance to the address is known (see assignDriver below).
      estimatedDeliveryAt: new Date(Date.now() + (serviceability.estimatedDeliveryMinutes ?? 60) * 60 * 1000),
      subtotal: totals.subtotal,
      discount: totals.discount,
      couponCode: totals.couponCode,
      deliveryFee: totals.deliveryFee,
      gstAmount: totals.gstAmount,
      totalAmount: totals.totalAmount,
      walletAmountUsed,
      prescriptionIds: input.prescriptionIds,
      deliveryOtpHash: hashToken(deliveryOtp),
      notes: input.notes,
      reservationExpiresAt: new Date(Date.now() + CHECKOUT_CONFIG.RESERVATION_HOLD_MINUTES * 60 * 1000),
    } as never);

    if (walletAmountUsed > 0) {
      await debitWallet(userId, walletAmountUsed, WalletTransactionReason.ORDER_PAYMENT, String(order._id));
    }
    if (totals.couponCode && totals.discount > 0) {
      const couponDoc = await couponRepository.findOne({ code: totals.couponCode });
      if (couponDoc) {
        await recordCouponRedemption(String(couponDoc._id), userId, String(order._id), totals.discount);
      }
    }

    if (totalAmount === 0) {
      // Fully covered by wallet — confirm immediately, no gateway round-trip needed.
      const confirmed = await confirmOrderPlacement(String(order._id));
      return { order: confirmed, paymentSessionId: null, requiresPayment: false };
    }

    if (input.paymentMethod === PaymentMethod.COD) {
      const confirmed = await confirmOrderPlacement(String(order._id));
      return { order: confirmed, paymentSessionId: null, requiresPayment: false };
    }

    // Cashfree
    const { paymentSessionId, cfOrderId } = await createCashfreeOrder({
      orderId: order.orderNumber,
      amount: totalAmount,
      customerId: userId,
      customerPhone: address.contactPhone,
      returnUrl,
    });
    order.cashfreeOrderId = cfOrderId;
    order.cashfreePaymentSessionId = paymentSessionId;
    await order.save();

    return { order, paymentSessionId, requiresPayment: true };
  } catch (err) {
    await inventoryService.releaseItems(
      totals.items.map((item) => ({ medicineId: item.medicineId, branchId: String(branch._id), quantity: item.quantity })),
    );
    throw err;
  }
}

/** Moves a paid/COD order from pending_payment to placed, clears the cart, and notifies the customer. */
export async function confirmOrderPlacement(orderId: string): Promise<IOrder> {
  const order = await orderRepository.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.status !== OrderStatus.PENDING_PAYMENT) return order;

  if (order.paymentMethod !== PaymentMethod.COD) {
    order.paymentStatus = PaymentStatus.PAID;
  }
  order.reservationExpiresAt = undefined;
  order.status = OrderStatus.PLACED;
  order.statusHistory.push({ status: OrderStatus.PLACED, changedAt: new Date() });
  await order.save();

  await cartRepository.clear(String(order.userId));

  await notifyUser({
    userId: String(order.userId),
    type: NotificationType.ORDER_UPDATE,
    title: 'Order placed successfully',
    message: `Your order ${order.orderNumber} has been placed and will be delivered soon.`,
    channels: [NotificationChannel.IN_APP, NotificationChannel.SMS, NotificationChannel.PUSH, NotificationChannel.WHATSAPP],
  });

  emitNewOrderAlert({
    id: String(order._id),
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    branchId: order.branchId ? String(order.branchId) : undefined,
  });

  return order;
}

/** Called from the Cashfree webhook when a payment fails or expires. */
export async function handlePaymentFailure(orderId: string): Promise<void> {
  const order = await orderRepository.findById(orderId);
  if (!order || order.status !== OrderStatus.PENDING_PAYMENT) return;

  await releaseOrderInventory(order);
  order.status = OrderStatus.CANCELLED;
  order.paymentStatus = PaymentStatus.FAILED;
  order.cancelledAt = new Date();
  order.cancellationReason = 'Payment failed';
  order.statusHistory.push({ status: OrderStatus.CANCELLED, changedAt: new Date(), reason: 'Payment failed' });
  await order.save();
}

async function releaseOrderInventory(order: IOrder): Promise<void> {
  await inventoryService.releaseItems(
    order.items.map((item) => ({
      medicineId: String(item.medicineId),
      branchId: String(order.branchId),
      quantity: item.quantity,
    })),
  );
}

function assertTransitionAllowed(from: OrderStatus, to: OrderStatus): void {
  if (!ORDER_STATUS_TRANSITIONS[from]?.includes(to)) {
    throw ApiError.badRequest(`Cannot move order from "${from}" to "${to}"`);
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  changedBy: string,
  reason?: string,
): Promise<IOrder> {
  const order = await orderRepository.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  assertTransitionAllowed(order.status, newStatus);

  if (newStatus === OrderStatus.PACKED) {
    // FIFO-allocate and physically deduct stock at packing time (not earlier — earlier
    // statuses only hold a reservation, no batch has been committed yet).
    for (const item of order.items) {
      const allocations = await inventoryService.planFifoAllocation(
        String(item.medicineId),
        String(order.branchId),
        item.quantity,
      );
      item.batchAllocations = allocations;
      await inventoryService.commitFifoConsumption(
        String(item.medicineId),
        String(order.branchId),
        allocations,
        String(order._id),
      );
    }
  }

  if (newStatus === OrderStatus.REJECTED || newStatus === OrderStatus.CANCELLED) {
    if (order.status === OrderStatus.PLACED || order.status === OrderStatus.ACCEPTED) {
      await releaseOrderInventory(order);
    } else if (order.status === OrderStatus.PACKED || order.status === OrderStatus.OUT_FOR_DELIVERY) {
      for (const item of order.items) {
        await inventoryService.restoreFifoConsumption(
          String(item.medicineId),
          String(order.branchId),
          item.batchAllocations,
          String(order._id),
        );
      }
    }
    if (order.paymentStatus === PaymentStatus.PAID && order.cashfreeOrderId) {
      await initiateCashfreeRefund(order.cashfreeOrderId, order.totalAmount, `refund_${order.orderNumber}`);
      order.paymentStatus = PaymentStatus.REFUNDED;
    }
    if (order.walletAmountUsed > 0) {
      await creditWallet(String(order.userId), order.walletAmountUsed, WalletTransactionReason.REFUND, String(order._id));
    }
    order.cancelledAt = new Date();
    order.cancellationReason = reason;
  }

  if (newStatus === OrderStatus.DELIVERED) {
    order.deliveredAt = new Date();
    if (order.paymentMethod === PaymentMethod.COD) {
      order.paymentStatus = PaymentStatus.PAID;
    }
    if (order.driverId) {
      await driverRepository.incrementDeliveries(String(order.driverId));
    }
    await generateInvoiceForOrder(order);
    void pushSaleInvoiceToMarg(order);
  }

  order.status = newStatus;
  order.statusHistory.push({ status: newStatus, changedAt: new Date(), changedBy: changedBy as never, reason });
  await order.save();

  emitOrderStatus(String(order._id), newStatus);

  if (newStatus === OrderStatus.DELIVERED) {
    void rewardReferralOnFirstDelivery(String(order.userId), String(order._id));
  }

  await notifyUser({
    userId: String(order.userId),
    type: NotificationType.ORDER_UPDATE,
    title: `Order ${newStatus.replace(/_/g, ' ')}`,
    message: `Your order ${order.orderNumber} is now "${newStatus.replace(/_/g, ' ')}".`,
    channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.WHATSAPP],
  });

  return order;
}

async function pushSaleInvoiceToMarg(order: IOrder): Promise<void> {
  if (env.MARG_INTEGRATION_MODE === 'disabled') return;

  const adapter = getMargAdapter();
  const log = await MargSyncLogModel.create({
    entity: 'sale_invoice',
    mode: env.MARG_INTEGRATION_MODE,
    status: MargSyncStatus.RUNNING,
  });

  try {
    const result = await adapter.pushSaleInvoice({
      orderId: order.orderNumber,
      invoiceNumber: order.orderNumber,
      items: order.items.map((item) => ({
        margItemCode: String(item.medicineId),
        batchNumber: item.batchAllocations[0]?.batchNumber,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        gstPercentage: item.gstPercentage,
      })),
      customerPhone: order.addressSnapshot.contactPhone,
      totalAmount: order.totalAmount,
    });

    order.margInvoiceSynced = result.success;
    order.margInvoiceRef = result.margRef;
    await order.save();

    log.status = result.success ? MargSyncStatus.SUCCESS : MargSyncStatus.FAILED;
    log.recordsProcessed = result.success ? 1 : 0;
    log.recordsFailed = result.success ? 0 : 1;
    if (result.message) log.errorMessages = [result.message];
    log.finishedAt = new Date();
    await log.save();
  } catch (err) {
    log.status = MargSyncStatus.FAILED;
    log.errorMessages = [(err as Error).message];
    log.finishedAt = new Date();
    await log.save();
  }
}

export async function cancelOrder(orderId: string, userId: string, reason: string): Promise<IOrder> {
  const order = await orderRepository.findOne({ _id: orderId, userId });
  if (!order) throw ApiError.notFound('Order not found');
  return updateOrderStatus(orderId, OrderStatus.CANCELLED, userId, reason);
}

export async function assignDriver(orderId: string, driverId: string): Promise<IOrder> {
  const order = await orderRepository.updateById(orderId, { driverId });
  if (!order) throw ApiError.notFound('Order not found');

  const driver = await DriverModel.findById(driverId).populate<{ userId: { name: string; phone?: string } }>(
    'userId',
    'name phone',
  );
  if (driver) {
    emitDriverAssigned(String(order._id), {
      name: driver.userId.name,
      phone: driver.userId.phone,
      vehicleNumber: driver.vehicleNumber,
    });

    // Best-effort ETA from the driver's last known position (or the branch, if they haven't
    // reported a location yet) to the delivery address — no-ops cleanly without a Maps key.
    const origin =
      driver.currentLat !== undefined && driver.currentLng !== undefined
        ? { lat: driver.currentLat, lng: driver.currentLng }
        : null;
    if (origin) {
      try {
        const distance = await getDrivingDistance(origin, { lat: order.addressSnapshot.lat, lng: order.addressSnapshot.lng });
        if (distance) {
          order.estimatedDeliveryAt = new Date(Date.now() + distance.durationSeconds * 1000);
          await order.save();
        }
      } catch (err) {
        logger.warn({ err, orderId }, 'ETA lookup failed; continuing without an estimate');
      }
    }
  }

  return order;
}

interface VerifyDeliveryOtpOptions {
  proofOfDeliveryUrl?: string;
  customerSignatureUrl?: string;
}

export async function verifyDeliveryOtp(
  orderId: string,
  otp: string,
  proofOptions: VerifyDeliveryOtpOptions = {},
): Promise<IOrder> {
  const order = await orderRepository.findOne({ _id: orderId }, '+deliveryOtpHash');
  if (!order || !order.deliveryOtpHash) {
    throw ApiError.badRequest('No delivery OTP is associated with this order');
  }
  if (order.deliveryOtpHash !== hashToken(otp)) {
    throw ApiError.badRequest('Invalid delivery OTP');
  }

  if (proofOptions.proofOfDeliveryUrl) order.proofOfDeliveryUrl = proofOptions.proofOfDeliveryUrl;
  if (proofOptions.customerSignatureUrl) order.customerSignatureUrl = proofOptions.customerSignatureUrl;
  if (proofOptions.proofOfDeliveryUrl || proofOptions.customerSignatureUrl) await order.save();

  return updateOrderStatus(orderId, OrderStatus.DELIVERED, String(order.driverId ?? ''));
}

export async function resendDeliveryOtp(orderId: string): Promise<void> {
  const order = await orderRepository.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  const otp = generateOtp();
  order.deliveryOtpHash = hashToken(otp);
  await order.save();
  await sendOtpSms({ phone: order.addressSnapshot.contactPhone, otp });
}

export function generateRefundId(): string {
  return crypto.randomBytes(12).toString('hex');
}
