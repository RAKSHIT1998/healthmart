import { Schema, model, Types, type Document } from 'mongoose';
import { MedicineRequestStatus } from '@buymedicines/shared';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IMedicineRequest extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  medicineName: string;
  notes?: string;
  status: MedicineRequestStatus;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const medicineRequestSchema = new Schema<IMedicineRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    medicineName: { type: String, required: true, trim: true, maxlength: 200 },
    notes: { type: String, maxlength: 500 },
    status: {
      type: String,
      enum: Object.values(MedicineRequestStatus),
      default: MedicineRequestStatus.PENDING,
      index: true,
    },
    adminNotes: { type: String, maxlength: 500 },
  },
  { timestamps: true },
);

medicineRequestSchema.index({ status: 1, createdAt: -1 });

toJSONPlugin(medicineRequestSchema);

export const MedicineRequestModel = model<IMedicineRequest>('MedicineRequest', medicineRequestSchema);
