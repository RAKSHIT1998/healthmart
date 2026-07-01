import { Schema, model, Types, type Document } from 'mongoose';
import { RefundMethod, ReturnReasonCategory, ReturnStatus } from '@buymedicines/shared';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IReturnRequestItem {
  medicineId: Types.ObjectId;
  name: string;
  quantity: number;
  sellingPrice: number;
  gstPercentage: number;
}

export interface IReturnRequest extends Document {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  branchId: Types.ObjectId;
  items: IReturnRequestItem[];
  reasonCategory: ReturnReasonCategory;
  reason?: string;
  status: ReturnStatus;
  refundAmount: number;
  refundMethod?: RefundMethod;
  rejectionReason?: string;
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const returnRequestItemSchema = new Schema<IReturnRequestItem>(
  {
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    sellingPrice: { type: Number, required: true },
    gstPercentage: { type: Number, required: true },
  },
  { _id: false },
);

const returnRequestSchema = new Schema<IReturnRequest>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    items: { type: [returnRequestItemSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    reasonCategory: { type: String, enum: Object.values(ReturnReasonCategory), required: true },
    reason: { type: String, maxlength: 300 },
    status: {
      type: String,
      enum: Object.values(ReturnStatus),
      default: ReturnStatus.REQUESTED,
      index: true,
    },
    refundAmount: { type: Number, required: true, min: 0 },
    refundMethod: { type: String, enum: Object.values(RefundMethod) },
    rejectionReason: { type: String, maxlength: 300 },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    processedAt: { type: Date },
  },
  { timestamps: true },
);

returnRequestSchema.index({ status: 1, createdAt: 1 });

toJSONPlugin(returnRequestSchema);

export const ReturnRequestModel = model<IReturnRequest>('ReturnRequest', returnRequestSchema);
