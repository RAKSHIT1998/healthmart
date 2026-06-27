import { Schema, model, Types, type Document } from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IFlashSaleItem {
  medicineId: Types.ObjectId;
  flashPrice: number;
}

export interface IFlashSale extends Document {
  _id: Types.ObjectId;
  name: string;
  bannerImage?: string;
  startAt: Date;
  endAt: Date;
  items: IFlashSaleItem[];
  isActive: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const flashSaleItemSchema = new Schema<IFlashSaleItem>(
  {
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
    flashPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const flashSaleSchema = new Schema<IFlashSale>(
  {
    name: { type: String, required: true, maxlength: 120 },
    bannerImage: { type: String },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },
    items: { type: [flashSaleItemSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

flashSaleSchema.index({ isActive: 1, startAt: 1, endAt: 1 });
toJSONPlugin(flashSaleSchema);

export const FlashSaleModel = model<IFlashSale>('FlashSale', flashSaleSchema);
