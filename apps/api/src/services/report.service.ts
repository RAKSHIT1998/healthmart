import { PaymentStatus } from '@healthmart/shared';
import { Types } from 'mongoose';
import { OrderModel } from '../models';
import { invoiceRepository } from '../repositories';
import { batchRepository, inventoryRepository } from '../repositories';

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]!);
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.join(','), ...rows.map((row) => headers.map((h) => escape(row[h])).join(','))];
  return lines.join('\n');
}

export async function getSalesReport(from: Date, to: Date, branchId?: string) {
  const orders = await OrderModel.find({
    createdAt: { $gte: from, $lte: to },
    paymentStatus: PaymentStatus.PAID,
    ...(branchId ? { branchId: new Types.ObjectId(branchId) } : {}),
  }).sort({ createdAt: -1 });

  const rows = orders.map((o) => ({
    orderNumber: o.orderNumber,
    date: o.createdAt.toISOString(),
    subtotal: o.subtotal,
    discount: o.discount,
    deliveryFee: o.deliveryFee,
    gstAmount: o.gstAmount,
    totalAmount: o.totalAmount,
    paymentMethod: o.paymentMethod,
    status: o.status,
  }));

  return { rows, csv: toCsv(rows) };
}

export async function getGstReport(from: Date, to: Date) {
  const invoices = await invoiceRepository.find({ generatedAt: { $gte: from, $lte: to } });

  const rows = invoices.map((inv) => ({
    invoiceNumber: inv.invoiceNumber,
    date: inv.generatedAt.toISOString(),
    taxableAmount: inv.taxableAmount,
    cgstAmount: inv.cgstAmount,
    sgstAmount: inv.sgstAmount,
    igstAmount: inv.igstAmount,
    totalGstAmount: inv.totalGstAmount,
    totalAmount: inv.totalAmount,
    isInterState: inv.isInterState,
  }));

  return { rows, csv: toCsv(rows) };
}

export async function getStockReport(branchId?: string) {
  const inventories = await inventoryRepository.find(branchId ? { branchId } : {});
  const populated = await Promise.all(
    inventories.map((inv) => inv.populate('medicineId', 'name sellingPrice')),
  );

  const rows = populated.map((inv) => {
    const medicine = inv.medicineId as unknown as { name: string; sellingPrice: number };
    return {
      medicine: medicine?.name ?? String(inv.medicineId),
      totalQuantity: inv.totalQuantity,
      reservedQuantity: inv.reservedQuantity,
      availableQuantity: Math.max(0, inv.totalQuantity - inv.reservedQuantity),
      sellingPrice: medicine?.sellingPrice ?? 0,
      stockValue: (medicine?.sellingPrice ?? 0) * inv.totalQuantity,
    };
  });

  return { rows, csv: toCsv(rows) };
}

export async function getExpiryReport(branchId?: string, withinDays?: number) {
  const batches = await batchRepository.findExpiringSoon(branchId, withinDays);

  const rows = batches.map((b) => {
    const medicine = b.medicineId as unknown as { name: string };
    return {
      medicine: medicine?.name ?? String(b.medicineId),
      batchNumber: b.batchNumber,
      expiryDate: b.expiryDate.toISOString().slice(0, 10),
      quantityRemaining: b.quantityRemaining,
    };
  });

  return { rows, csv: toCsv(rows) };
}
