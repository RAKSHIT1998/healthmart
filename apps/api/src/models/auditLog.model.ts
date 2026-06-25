import { Schema, model, Types, type Document } from 'mongoose';
import { AuditAction } from '@healthmart/shared';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  actorId?: Types.ObjectId;
  actorRole?: string;
  action: AuditAction;
  entityType: string;
  entityId?: Types.ObjectId;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorRole: { type: String },
    action: { type: String, enum: Object.values(AuditAction), required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: Schema.Types.ObjectId, index: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const AuditLogModel = model<IAuditLog>('AuditLog', auditLogSchema);
