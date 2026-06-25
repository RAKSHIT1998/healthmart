import { z } from 'zod';

/**
 * Canonical shape Marg data is normalized into regardless of which adapter
 * (CSV, webhook, or future direct API) produced it. Every adapter implementation
 * must map its source format onto this schema before handing off to MargSyncService.
 */
export const margMedicinePayloadSchema = z.object({
  margItemCode: z.string().min(1),
  name: z.string().min(1),
  composition: z.string().optional(),
  manufacturer: z.string().optional(),
  hsnCode: z.string().optional(),
  mrp: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  gstPercentage: z.number().min(0).max(28),
  packSize: z.string().optional(),
});

export const margStockPayloadSchema = z.object({
  margItemCode: z.string().min(1),
  branchCode: z.string().optional(),
  batchNumber: z.string().min(1),
  expiryDate: z.string(),
  quantity: z.number().int(),
  costPrice: z.number().nonnegative().optional(),
});

export const margSaleInvoicePushSchema = z.object({
  orderId: z.string(),
  invoiceNumber: z.string(),
  items: z.array(
    z.object({
      margItemCode: z.string(),
      batchNumber: z.string().optional(),
      quantity: z.number().int().positive(),
      sellingPrice: z.number().nonnegative(),
      gstPercentage: z.number().min(0).max(28),
    }),
  ),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  totalAmount: z.number().nonnegative(),
});

export const margSupplierPayloadSchema = z.object({
  margSupplierCode: z.string().min(1),
  name: z.string().min(1),
  gstin: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
});

export const margCustomerPayloadSchema = z.object({
  margCustomerCode: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
});

export const margReturnPushSchema = z.object({
  orderId: z.string(),
  originalInvoiceNumber: z.string(),
  items: z.array(
    z.object({
      margItemCode: z.string(),
      batchNumber: z.string().optional(),
      quantity: z.number().int().positive(),
    }),
  ),
  reason: z.string().optional(),
  totalAmount: z.number().nonnegative(),
});

export const margWebhookEnvelopeSchema = z.object({
  entity: z.enum([
    'medicine',
    'stock',
    'price',
    'batch',
    'supplier',
    'customer',
    'sale_invoice',
    'return',
    'credit_note',
    'debit_note',
  ]),
  records: z.array(z.record(z.string(), z.unknown())).min(1),
  sourceTimestamp: z.string().optional(),
});

export const triggerMargSyncSchema = z.object({
  entity: z
    .enum([
      'medicine',
      'stock',
      'price',
      'batch',
      'supplier',
      'customer',
      'sale_invoice',
      'return',
      'credit_note',
      'debit_note',
    ])
    .optional(),
});

export type MargMedicinePayload = z.infer<typeof margMedicinePayloadSchema>;
export type MargStockPayload = z.infer<typeof margStockPayloadSchema>;
export type MargSaleInvoicePush = z.infer<typeof margSaleInvoicePushSchema>;
export type MargSupplierPayload = z.infer<typeof margSupplierPayloadSchema>;
export type MargCustomerPayload = z.infer<typeof margCustomerPayloadSchema>;
export type MargReturnPush = z.infer<typeof margReturnPushSchema>;
export type MargWebhookEnvelope = z.infer<typeof margWebhookEnvelopeSchema>;
