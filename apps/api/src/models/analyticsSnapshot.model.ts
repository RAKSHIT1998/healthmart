import { Schema, model, Types, type Document } from 'mongoose';

/** One pre-aggregated daily rollup per branch, written by the nightly analytics job. */
export interface IAnalyticsSnapshot extends Document {
  _id: Types.ObjectId;
  date: string; // YYYY-MM-DD
  branchId: Types.ObjectId;
  totalOrders: number;
  totalRevenue: number;
  totalDiscount: number;
  cancelledOrders: number;
  newCustomers: number;
  averageOrderValue: number;
  createdAt: Date;
}

const analyticsSnapshotSchema = new Schema<IAnalyticsSnapshot>(
  {
    date: { type: String, required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    newCustomers: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

analyticsSnapshotSchema.index({ date: 1, branchId: 1 }, { unique: true });

export const AnalyticsSnapshotModel = model<IAnalyticsSnapshot>(
  'AnalyticsSnapshot',
  analyticsSnapshotSchema,
);
