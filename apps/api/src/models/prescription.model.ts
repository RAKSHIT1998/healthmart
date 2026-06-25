import { Schema, model, Types, type Document } from 'mongoose';
import { PrescriptionStatus } from '@healthmart/shared';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IPrescription extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  imageUrls: string[];
  notes?: string;
  ocrRawText?: string;
  ocrMatchedTerms: string[];
  status: PrescriptionStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  matchedMedicineIds: Types.ObjectId[];
  linkedOrderId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const prescriptionSchema = new Schema<IPrescription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    imageUrls: { type: [String], required: true },
    notes: { type: String, maxlength: 300 },
    ocrRawText: { type: String },
    ocrMatchedTerms: { type: [String], default: [] },
    status: {
      type: String,
      enum: Object.values(PrescriptionStatus),
      default: PrescriptionStatus.PENDING,
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
    matchedMedicineIds: [{ type: Schema.Types.ObjectId, ref: 'Medicine' }],
    linkedOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true },
);

toJSONPlugin(prescriptionSchema);

export const PrescriptionModel = model<IPrescription>('Prescription', prescriptionSchema);
