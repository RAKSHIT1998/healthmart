export enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  PLACED = 'placed',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  PACKED = 'packed',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

/** Allowed forward transitions for the order status machine. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PLACED, OrderStatus.CANCELLED],
  [OrderStatus.PLACED]: [OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  [OrderStatus.REJECTED]: [],
  [OrderStatus.PACKED]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.RETURNED]: [],
};

export enum PaymentMethod {
  CASHFREE = 'cashfree',
  COD = 'cod',
  WALLET = 'wallet',
}

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum DeliverySlotType {
  STANDARD = 'standard',
  EXPRESS = 'express',
  SCHEDULED = 'scheduled',
}

export enum ReturnStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
}

export enum ReturnReasonCategory {
  DAMAGED = 'damaged',
  WRONG_ITEM = 'wrong_item',
  EXPIRED = 'expired',
  QUALITY_ISSUE = 'quality_issue',
  NO_LONGER_NEEDED = 'no_longer_needed',
  OTHER = 'other',
}

export enum RefundMethod {
  WALLET = 'wallet',
  ORIGINAL_PAYMENT = 'original_payment',
}
