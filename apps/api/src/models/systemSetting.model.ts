import { Schema, model, Types, type Document } from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.plugin';

/** Singleton document (one row per `key`) for small admin-toggleable flags that don't warrant their own collection. */
export interface ISystemSetting extends Document {
  _id: Types.ObjectId;
  key: string;
  otpBypassEnabled: boolean;
  otpBypassUpdatedAt?: Date;
  otpBypassUpdatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const systemSettingSchema = new Schema<ISystemSetting>(
  {
    key: { type: String, required: true, unique: true },
    otpBypassEnabled: { type: Boolean, default: false },
    otpBypassUpdatedAt: { type: Date },
    otpBypassUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

toJSONPlugin(systemSettingSchema);

export const SystemSettingModel = model<ISystemSetting>('SystemSetting', systemSettingSchema);
