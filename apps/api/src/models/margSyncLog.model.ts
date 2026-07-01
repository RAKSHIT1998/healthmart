import { Schema, model, Types, type Document } from 'mongoose';
import { MargIntegrationMode, MargSyncEntity, MargSyncStatus } from '@buymedicines/shared';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IMargSyncLog extends Document {
  _id: Types.ObjectId;
  entity: MargSyncEntity;
  mode: MargIntegrationMode;
  status: MargSyncStatus;
  recordsProcessed: number;
  recordsFailed: number;
  errorMessages: string[];
  sourceFile?: string;
  triggeredBy?: Types.ObjectId;
  startedAt: Date;
  finishedAt?: Date;
  createdAt: Date;
}

const margSyncLogSchema = new Schema<IMargSyncLog>(
  {
    entity: { type: String, enum: Object.values(MargSyncEntity), required: true, index: true },
    mode: { type: String, enum: Object.values(MargIntegrationMode), required: true },
    status: {
      type: String,
      enum: Object.values(MargSyncStatus),
      default: MargSyncStatus.RUNNING,
      index: true,
    },
    recordsProcessed: { type: Number, default: 0 },
    recordsFailed: { type: Number, default: 0 },
    errorMessages: { type: [String], default: [] },
    sourceFile: { type: String },
    triggeredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// listRecent always sorts newest-first.
margSyncLogSchema.index({ createdAt: -1 });

toJSONPlugin(margSyncLogSchema);

export const MargSyncLogModel = model<IMargSyncLog>('MargSyncLog', margSyncLogSchema);
