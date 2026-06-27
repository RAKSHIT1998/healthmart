import { Schema, model, Types, type Document } from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IGiftCard extends Document {
  _id: Types.ObjectId;
  code: string;
  initialValue: number;
  balance: number;
  issuedBy?: Types.ObjectId;
  issuedToEmail?: string;
  issuedToPhone?: string;
  redeemedBy?: Types.ObjectId;
  redeemedAt?: Date;
  expiresAt?: Date;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const giftCardSchema = new Schema<IGiftCard>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    initialValue: { type: Number, required: true, min: 1 },
    balance: { type: Number, required: true, min: 0 },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    issuedToEmail: { type: String },
    issuedToPhone: { type: String },
    redeemedBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    redeemedAt: { type: Date },
    expiresAt: { type: Date },
    notes: { type: String, maxlength: 300 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

toJSONPlugin(giftCardSchema);

export const GiftCardModel = model<IGiftCard>('GiftCard', giftCardSchema);
