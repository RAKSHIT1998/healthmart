import { Schema, model, Types, type Document } from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IManufacturer extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  logo?: string;
  country?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const manufacturerSchema = new Schema<IManufacturer>(
  {
    name: { type: String, required: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    logo: { type: String },
    country: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

toJSONPlugin(manufacturerSchema);

export const ManufacturerModel = model<IManufacturer>('Manufacturer', manufacturerSchema);
