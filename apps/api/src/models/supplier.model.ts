import { Schema, model, Types, type Document } from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface ISupplier extends Document {
  _id: Types.ObjectId;
  name: string;
  gstin?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  margSupplierCode?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true, maxlength: 150 },
    gstin: { type: String },
    contactPerson: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    margSupplierCode: { type: String, index: true, sparse: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

toJSONPlugin(supplierSchema);

export const SupplierModel = model<ISupplier>('Supplier', supplierSchema);
