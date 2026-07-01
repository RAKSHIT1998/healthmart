import { Schema, model, Types, type Document } from 'mongoose';
import { InventoryMovementType } from '@buymedicines/shared';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IInventoryMovement extends Document {
  _id: Types.ObjectId;
  medicineId: Types.ObjectId;
  branchId: Types.ObjectId;
  batchId?: Types.ObjectId;
  type: InventoryMovementType;
  quantity: number;
  referenceType?: string;
  referenceId?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
}

const inventoryMovementSchema = new Schema<IInventoryMovement>(
  {
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch' },
    type: { type: String, enum: Object.values(InventoryMovementType), required: true, index: true },
    quantity: { type: Number, required: true },
    referenceType: { type: String },
    referenceId: { type: Schema.Types.ObjectId },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

toJSONPlugin(inventoryMovementSchema);

export const InventoryMovementModel = model<IInventoryMovement>(
  'InventoryMovement',
  inventoryMovementSchema,
);
