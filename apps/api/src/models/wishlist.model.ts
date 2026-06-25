import { Schema, model, Types, type Document } from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IWishlist extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  medicineIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    medicineIds: [{ type: Schema.Types.ObjectId, ref: 'Medicine' }],
  },
  { timestamps: true },
);

toJSONPlugin(wishlistSchema);

export const WishlistModel = model<IWishlist>('Wishlist', wishlistSchema);
