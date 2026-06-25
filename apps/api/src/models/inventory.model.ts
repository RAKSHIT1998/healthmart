import { Schema, model, Types, type Document } from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.plugin';

/**
 * Fast-path stock ledger: one document per (medicine, branch). `reservedQuantity`
 * is held during checkout so concurrent buyers can never oversell; `totalQuantity`
 * is the physical count rolled up from Batch documents. availableQuantity is always
 * totalQuantity - reservedQuantity and must only ever change via atomic $inc updates
 * guarded by $expr (see InventoryService) — never read-then-write.
 */
export interface IInventory extends Document {
  _id: Types.ObjectId;
  medicineId: Types.ObjectId;
  branchId: Types.ObjectId;
  totalQuantity: number;
  reservedQuantity: number;
  rackNumber?: string;
  warehouse?: string;
  lowStockThreshold: number;
  lastSyncedFromMargAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>(
  {
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    totalQuantity: { type: Number, required: true, min: 0, default: 0 },
    reservedQuantity: { type: Number, required: true, min: 0, default: 0 },
    rackNumber: { type: String },
    warehouse: { type: String },
    lowStockThreshold: { type: Number, default: 10 },
    lastSyncedFromMargAt: { type: Date },
  },
  { timestamps: true },
);

inventorySchema.index({ medicineId: 1, branchId: 1 }, { unique: true });
inventorySchema.virtual('availableQuantity').get(function (this: IInventory) {
  return Math.max(0, this.totalQuantity - this.reservedQuantity);
});

toJSONPlugin(inventorySchema);

export const InventoryModel = model<IInventory>('Inventory', inventorySchema);
