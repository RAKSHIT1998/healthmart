import { Schema, model, Types, type Document } from 'mongoose';

export interface IOtp extends Document {
  _id: Types.ObjectId;
  phone?: string;
  email?: string;
  otpHash: string;
  purpose: 'login' | 'signup' | 'checkout' | 'password_reset';
  attempts: number;
  verified: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    phone: { type: String, index: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    otpHash: { type: String, required: true },
    purpose: { type: String, enum: ['login', 'signup', 'checkout', 'password_reset'], default: 'login' },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpModel = model<IOtp>('Otp', otpSchema);
