import { Schema, model, Types, type Document } from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IBatch extends Document {
  _id: Types.ObjectId;
  medicineId: Types.ObjectId;
  branchId: Types.ObjectId;
  batchNumber: string;
  expiryDate: Date;
  quantityReceived: number;
  quantityRemaining: number;
  costPrice: number;
  supplierId?: Types.ObjectId;
  rackNumber?: string;
  warehouse?: string;
  margBatchRef?: string;
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const batchSchema = new Schema<IBatch>(
  {
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    batchNumber: { type: String, required: true },
    expiryDate: { type: Date, required: true, index: true },
    quantityReceived: { type: Number, required: true, min: 0 },
    quantityRemaining: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    rackNumber: { type: String },
    warehouse: { type: String },
    margBatchRef: { type: String, index: true, sparse: true },
    receivedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// FIFO allocation scans by expiry date ascending within a medicine+branch.
batchSchema.index({ medicineId: 1, branchId: 1, expiryDate: 1, quantityRemaining: 1 });

toJSONPlugin(batchSchema);

export const BatchModel = model<IBatch>('Batch', batchSchema);
