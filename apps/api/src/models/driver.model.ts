import { Schema, model, Types, type Document } from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IDriver extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  branchId: Types.ObjectId;
  vehicleType: 'bike' | 'scooter' | 'bicycle' | 'car';
  vehicleNumber?: string;
  isAvailable: boolean;
  currentLat?: number;
  currentLng?: number;
  lastLocationUpdateAt?: Date;
  rating: number;
  totalDeliveries: number;
  createdAt: Date;
  updatedAt: Date;
}

const driverSchema = new Schema<IDriver>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    vehicleType: { type: String, enum: ['bike', 'scooter', 'bicycle', 'car'], required: true },
    vehicleNumber: { type: String },
    isAvailable: { type: Boolean, default: true, index: true },
    currentLat: { type: Number },
    currentLng: { type: Number },
    lastLocationUpdateAt: { type: Date },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    totalDeliveries: { type: Number, default: 0 },
  },
  { timestamps: true },
);

toJSONPlugin(driverSchema);

export const DriverModel = model<IDriver>('Driver', driverSchema);
