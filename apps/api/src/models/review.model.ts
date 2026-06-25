import { Schema, model, Types, type Document } from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IReview extends Document {
  _id: Types.ObjectId;
  medicineId: Types.ObjectId;
  userId: Types.ObjectId;
  orderId?: Types.ObjectId;
  rating: number;
  title?: string;
  comment?: string;
  images: string[];
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, maxlength: 120 },
    comment: { type: String, maxlength: 1000 },
    images: { type: [String], default: [] },
    isApproved: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

reviewSchema.index({ medicineId: 1, userId: 1 }, { unique: true });
toJSONPlugin(reviewSchema);

export const ReviewModel = model<IReview>('Review', reviewSchema);
