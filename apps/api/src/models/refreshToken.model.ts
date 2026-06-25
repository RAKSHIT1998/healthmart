import { Schema, model, Types, type Document } from 'mongoose';

export interface IRefreshToken extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  jti: string;
  tokenHash: string;
  family: string;
  revoked: boolean;
  replacedByJti?: string;
  userAgent?: string;
  ip?: string;
  expiresAt: Date;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jti: { type: String, required: true, unique: true },
    tokenHash: { type: String, required: true },
    family: { type: String, required: true, index: true },
    revoked: { type: Boolean, default: false },
    replacedByJti: { type: String },
    userAgent: { type: String },
    ip: { type: String },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel = model<IRefreshToken>('RefreshToken', refreshTokenSchema);
