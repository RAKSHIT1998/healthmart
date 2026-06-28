import { Schema, model, Types, type Document } from 'mongoose';
import { Role } from '@healthmart/shared';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface INotificationPreferences {
  sms: boolean;
  email: boolean;
  push: boolean;
  whatsapp: boolean;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  role: Role;
  branchId?: Types.ObjectId;
  avatarUrl?: string;
  isActive: boolean;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  loyaltyPoints: number;
  fcmTokens: string[];
  tokenVersion: number;
  referralCode?: string;
  referredBy?: Types.ObjectId;
  notificationPreferences: INotificationPreferences;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, lowercase: true, trim: true, sparse: true, unique: true },
    phone: { type: String, trim: true, sparse: true, unique: true },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: Object.values(Role), default: Role.CUSTOMER, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    avatarUrl: { type: String },
    isActive: { type: Boolean, default: true },
    isPhoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    fcmTokens: { type: [String], default: [] },
    tokenVersion: { type: Number, default: 0 },
    referralCode: { type: String, unique: true, sparse: true, uppercase: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notificationPreferences: {
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: true },
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.index({ name: 'text', email: 'text', phone: 'text' });
toJSONPlugin(userSchema, ['passwordHash']);

export const UserModel = model<IUser>('User', userSchema);
