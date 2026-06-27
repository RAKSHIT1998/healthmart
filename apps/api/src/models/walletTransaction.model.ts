import { Schema, model, Types, type Document } from 'mongoose';
import { WalletTransactionReason, WalletTransactionType } from '@healthmart/shared';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IWalletTransaction extends Document {
  _id: Types.ObjectId;
  walletId: Types.ObjectId;
  userId: Types.ObjectId;
  type: WalletTransactionType;
  amount: number;
  reason: WalletTransactionReason;
  balanceAfter: number;
  referenceId?: Types.ObjectId;
  remarks?: string;
  createdAt: Date;
}

const walletTransactionSchema = new Schema<IWalletTransaction>(
  {
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(WalletTransactionType), required: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, enum: Object.values(WalletTransactionReason), required: true },
    balanceAfter: { type: Number, required: true },
    referenceId: { type: Schema.Types.ObjectId },
    remarks: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Matches listForUser's exact filter+sort (userId, newest first).
walletTransactionSchema.index({ userId: 1, createdAt: -1 });

toJSONPlugin(walletTransactionSchema);

export const WalletTransactionModel = model<IWalletTransaction>(
  'WalletTransaction',
  walletTransactionSchema,
);
