import { Schema, model, type Document, Types } from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IEmailCampaign extends Document {
  _id: Types.ObjectId;
  name: string;
  subject: string;
  previewText?: string;
  headline: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  audience: 'all' | 'customers' | 'staff';
  sendToSubscribedOnly: boolean;
  testEmail?: string;
  status: 'draft' | 'sent' | 'failed';
  recipientsCount: number;
  deliveredCount: number;
  failedCount: number;
  lastError?: string;
  sentAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const emailCampaignSchema = new Schema<IEmailCampaign>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    previewText: { type: String, trim: true, maxlength: 200 },
    headline: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, maxlength: 5000 },
    ctaLabel: { type: String, trim: true, maxlength: 50 },
    ctaUrl: { type: String, trim: true },
    audience: { type: String, enum: ['all', 'customers', 'staff'], default: 'customers', required: true },
    sendToSubscribedOnly: { type: Boolean, default: true },
    testEmail: { type: String, trim: true, lowercase: true },
    status: { type: String, enum: ['draft', 'sent', 'failed'], default: 'draft', index: true },
    recipientsCount: { type: Number, default: 0, min: 0 },
    deliveredCount: { type: Number, default: 0, min: 0 },
    failedCount: { type: Number, default: 0, min: 0 },
    lastError: { type: String },
    sentAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

emailCampaignSchema.index({ createdAt: -1 });
toJSONPlugin(emailCampaignSchema);

export const EmailCampaignModel = model<IEmailCampaign>('EmailCampaign', emailCampaignSchema);
