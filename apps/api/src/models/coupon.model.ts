import { Schema, model, Types, type Document } from 'mongoose';
import { CouponType } from '@healthmart/shared';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  description?: string;
  type: CouponType;
  value: number;
  maxDiscount?: number;
  minOrderValue: number;
  usageLimitPerUser: number;
  totalUsageLimit?: number;
  usedCount: number;
  validFrom: Date;
  validTill: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String },
    type: { type: String, enum: Object.values(CouponType), required: true },
    value: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    minOrderValue: { type: Number, default: 0, min: 0 },
    usageLimitPerUser: { type: Number, default: 1, min: 1 },
    totalUsageLimit: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    validFrom: { type: Date, required: true },
    validTill: { type: Date, required: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

toJSONPlugin(couponSchema);

export const CouponModel = model<ICoupon>('Coupon', couponSchema);
