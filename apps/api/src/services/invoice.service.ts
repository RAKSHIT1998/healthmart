import { invoiceRepository } from '../repositories';
import { BranchModel, type IOrder } from '../models';
import { generateInvoicePdf } from '../integrations/pdf/invoicePdf';
import { uploadToCloudinary } from '../integrations/cloudinary';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';

function currentFinancialYearLabel(): string {
  const date = new Date();
  return date.getMonth() >= 3
    ? `${date.getFullYear()}-${String(date.getFullYear() + 1).slice(-2)}`
    : `${date.getFullYear() - 1}-${String(date.getFullYear()).slice(-2)}`;
}

export async function generateInvoiceForOrder(order: IOrder) {
  const existing = await invoiceRepository.findByOrderId(String(order._id));
  if (existing) return existing;

  const branch = await BranchModel.findById(order.branchId);
  if (!branch) throw ApiError.internal('Branch not found for order');

  const totalGstAmount = Math.round(order.gstAmount * 100) / 100;
  const taxableAmount = Math.round((order.subtotal - order.discount - totalGstAmount) * 100) / 100;
  const isInterState = branch.state.toLowerCase().trim() !== order.addressSnapshot.state.toLowerCase().trim();

  const fyLabel = currentFinancialYearLabel();
  const sequence = (await invoiceRepository.countForFinancialYear(fyLabel)) + 1;

  const invoice = await invoiceRepository.create({
    orderId: order._id,
    branchId: branch._id,
    invoiceNumber: `INV/${fyLabel}/${String(sequence).padStart(6, '0')}`,
    cgstAmount: isInterState ? 0 : Math.round((totalGstAmount / 2) * 100) / 100,
    sgstAmount: isInterState ? 0 : Math.round((totalGstAmount / 2) * 100) / 100,
    igstAmount: isInterState ? totalGstAmount : 0,
    totalGstAmount,
    taxableAmount,
    totalAmount: order.totalAmount,
    isInterState,
  } as never);

  try {
    const pdfBuffer = await generateInvoicePdf(order, invoice, branch);
    const upload = await uploadToCloudinary(pdfBuffer, 'invoices', 'application/pdf', 'raw');
    invoice.pdfUrl = upload.url;
    await invoice.save();
  } catch (err) {
    logger.error({ err, orderId: order._id }, 'Invoice PDF generation/upload failed; invoice record kept without pdfUrl');
  }

  return invoice;
}

export async function getInvoiceForOrder(orderId: string) {
  const invoice = await invoiceRepository.findByOrderId(orderId);
  if (!invoice) throw ApiError.notFound('Invoice not found for this order');
  return invoice;
}
