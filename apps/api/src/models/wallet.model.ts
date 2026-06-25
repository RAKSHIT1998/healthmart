import { Schema, model, Types, type Document } from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IWallet extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

toJSONPlugin(walletSchema);

export const WalletModel = model<IWallet>('Wallet', walletSchema);
