import { Schema, model, Types, type Document } from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface ICartItem {
  medicineId: Types.ObjectId;
  variantLabel?: string;
  quantity: number;
}

export interface ICart extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: ICartItem[];
  couponCode?: string;
  updatedAt: Date;
  createdAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
    variantLabel: { type: String },
    quantity: { type: Number, required: true, min: 1, max: 50 },
  },
  { _id: false },
);

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
    couponCode: { type: String },
  },
  { timestamps: true },
);

toJSONPlugin(cartSchema);

export const CartModel = model<ICart>('Cart', cartSchema);
