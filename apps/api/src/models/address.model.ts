import { Schema, model, Types, type Document } from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IAddress extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  label: 'home' | 'work' | 'other';
  contactName: string;
  contactPhone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
    contactName: { type: String, required: true, maxlength: 80 },
    contactPhone: { type: String, required: true },
    line1: { type: String, required: true, maxlength: 150 },
    line2: { type: String, maxlength: 150 },
    landmark: { type: String, maxlength: 100 },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

addressSchema.index({ userId: 1, isDefault: 1 });
toJSONPlugin(addressSchema);

export const AddressModel = model<IAddress>('Address', addressSchema);
