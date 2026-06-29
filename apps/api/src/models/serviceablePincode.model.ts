import { Schema, model, Types, type Document } from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IServiceablePincode extends Document {
  _id: Types.ObjectId;
  pincode: string;
  branchId: Types.ObjectId;
  estimatedDeliveryMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceablePincodeSchema = new Schema<IServiceablePincode>(
  {
    pincode: { type: String, required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    estimatedDeliveryMinutes: { type: Number, required: true, min: 5, max: 1440 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// One branch can't list the same pincode twice; lookups filter by pincode+isActive then rank by ETA.
serviceablePincodeSchema.index({ pincode: 1, branchId: 1 }, { unique: true });
serviceablePincodeSchema.index({ pincode: 1, isActive: 1, estimatedDeliveryMinutes: 1 });

toJSONPlugin(serviceablePincodeSchema);

export const ServiceablePincodeModel = model<IServiceablePincode>('ServiceablePincode', serviceablePincodeSchema);
