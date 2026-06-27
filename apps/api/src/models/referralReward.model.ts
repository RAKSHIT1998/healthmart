import { Schema, model, Types, type Document } from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.plugin';

/** One row per successfully-rewarded referral — also doubles as the de-dupe guard against double-rewarding a referee's first order. */
export interface IReferralReward extends Document {
  _id: Types.ObjectId;
  referrerId: Types.ObjectId;
  refereeId: Types.ObjectId;
  orderId: Types.ObjectId;
  referrerReward: number;
  refereeReward: number;
  createdAt: Date;
}

const referralRewardSchema = new Schema<IReferralReward>(
  {
    referrerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refereeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    referrerReward: { type: Number, required: true, min: 0 },
    refereeReward: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

toJSONPlugin(referralRewardSchema);

export const ReferralRewardModel = model<IReferralReward>('ReferralReward', referralRewardSchema);
