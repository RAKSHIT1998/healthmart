import { Schema, model, Types, type Document } from 'mongoose';

export interface ICouponRedemption extends Document {
  _id: Types.ObjectId;
  couponId: Types.ObjectId;
  userId: Types.ObjectId;
  orderId: Types.ObjectId;
  discountAmount: number;
  createdAt: Date;
}

const couponRedemptionSchema = new Schema<ICouponRedemption>(
  {
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    discountAmount: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

couponRedemptionSchema.index({ couponId: 1, userId: 1 });

export const CouponRedemptionModel = model<ICouponRedemption>(
  'CouponRedemption',
  couponRedemptionSchema,
);
