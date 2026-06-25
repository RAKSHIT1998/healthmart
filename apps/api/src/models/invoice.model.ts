import { Schema, model, Types, type Document } from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IInvoice extends Document {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  branchId: Types.ObjectId;
  invoiceNumber: string;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
  taxableAmount: number;
  totalAmount: number;
  pdfUrl?: string;
  isInterState: boolean;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    invoiceNumber: { type: String, required: true, unique: true },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    totalGstAmount: { type: Number, default: 0 },
    taxableAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    pdfUrl: { type: String },
    isInterState: { type: Boolean, default: false },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

toJSONPlugin(invoiceSchema);

export const InvoiceModel = model<IInvoice>('Invoice', invoiceSchema);
