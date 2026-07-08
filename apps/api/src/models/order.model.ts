import { Schema, model, Types, type Document } from 'mongoose';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@buymedicines/shared';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IBatchAllocation {
  batchId?: Types.ObjectId;
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
}

export interface IOrderItem {
  medicineId: Types.ObjectId;
  name: string;
  image?: string;
  variantLabel?: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  gstPercentage: number;
  hsnCode: string;
  prescriptionRequired: boolean;
  batchAllocations: IBatchAllocation[];
}

export interface IStatusHistoryEntry {
  status: OrderStatus;
  changedAt: Date;
  changedBy?: Types.ObjectId;
  reason?: string;
}

export interface IAddressSnapshot {
  contactName: string;
  contactPhone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  userId: Types.ObjectId;
  branchId: Types.ObjectId;
  items: IOrderItem[];
  addressSnapshot: IAddressSnapshot;
  deliverySlot: {
    type: 'standard' | 'express' | 'scheduled';
    date?: Date;
    windowStart?: string;
    windowEnd?: string;
  };
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  statusHistory: IStatusHistoryEntry[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  deliveryFee: number;
  gstAmount: number;
  totalAmount: number;
  walletAmountUsed: number;
  prescriptionIds: Types.ObjectId[];
  requiresPrescriptionVerificationAtDelivery: boolean;
  prescriptionVerifiedAtDelivery: boolean;
  driverId?: Types.ObjectId;
  deliveryOtpHash?: string;
  proofOfDeliveryUrl?: string;
  customerSignatureUrl?: string;
  estimatedDeliveryAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  margInvoiceSynced: boolean;
  margInvoiceRef?: string;
  notes?: string;
  cashfreeOrderId?: string;
  cashfreePaymentSessionId?: string;
  reservationExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const batchAllocationSchema = new Schema<IBatchAllocation>(
  {
    // Optional: planFifoAllocation() falls back to an untracked allocation (no batchId) when
    // stock isn't covered by local Batch records yet (e.g. MARG-synced totals, or demo seed data
    // that sets Inventory totals directly) — Inventory.totalQuantity remains the source of truth.
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch' },
    batchNumber: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const orderItemSchema = new Schema<IOrderItem>(
  {
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
    name: { type: String, required: true },
    image: { type: String },
    variantLabel: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    mrp: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    gstPercentage: { type: Number, required: true },
    hsnCode: { type: String, required: true },
    prescriptionRequired: { type: Boolean, default: false },
    batchAllocations: { type: [batchAllocationSchema], default: [] },
  },
  { _id: false },
);

const addressSnapshotSchema = new Schema<IAddressSnapshot>(
  {
    contactName: { type: String, required: true },
    contactPhone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    landmark: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false },
);

const statusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status: { type: String, enum: Object.values(OrderStatus), required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    items: { type: [orderItemSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    addressSnapshot: { type: addressSnapshotSchema, required: true },
    deliverySlot: {
      type: { type: String, enum: ['standard', 'express', 'scheduled'], required: true },
      date: { type: Date },
      windowStart: { type: String },
      windowEnd: { type: String },
    },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), required: true },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING_PAYMENT,
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String },
    deliveryFee: { type: Number, default: 0, min: 0 },
    gstAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    walletAmountUsed: { type: Number, default: 0, min: 0 },
    prescriptionIds: [{ type: Schema.Types.ObjectId, ref: 'Prescription' }],
    requiresPrescriptionVerificationAtDelivery: { type: Boolean, default: false },
    prescriptionVerifiedAtDelivery: { type: Boolean, default: false },
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver', index: true },
    deliveryOtpHash: { type: String, select: false },
    proofOfDeliveryUrl: { type: String },
    customerSignatureUrl: { type: String },
    estimatedDeliveryAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
    margInvoiceSynced: { type: Boolean, default: false },
    margInvoiceRef: { type: String },
    notes: { type: String, maxlength: 300 },
    cashfreeOrderId: { type: String, index: true, sparse: true },
    cashfreePaymentSessionId: { type: String },
    reservationExpiresAt: { type: Date },
  },
  { timestamps: true },
);

// Each compound index below matches an exact filter+sort used somewhere in order.repository.ts
// or report.service.ts — chosen deliberately rather than indexing every field separately, since
// over-indexing slows down every order write (and this collection is the highest-write-volume one
// in the whole schema).
orderSchema.index({ userId: 1, createdAt: -1 }); // customer order history
orderSchema.index({ status: 1, createdAt: -1 }); // admin status-filtered list
orderSchema.index({ branchId: 1, createdAt: -1 }); // admin branch-filtered list / per-branch reports
orderSchema.index({ paymentStatus: 1, createdAt: -1 }); // sales report date-range query
orderSchema.index({ status: 1, reservationExpiresAt: 1 }); // expired-reservation cron sweep

toJSONPlugin(orderSchema, ['deliveryOtpHash']);

export const OrderModel = model<IOrder>('Order', orderSchema);
