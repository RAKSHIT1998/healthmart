import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { IOrder } from '../../models/order.model';
import type { IInvoice } from '../../models/invoice.model';
import type { IBranch } from '../../models/branch.model';

const PAGE_WIDTH = 595.28; // A4 width in points
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;

export async function generateInvoicePdf(
  order: IOrder,
  invoice: IInvoice,
  branch: IBranch,
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = PAGE_HEIGHT - MARGIN;

  const drawText = (
    text: string,
    x: number,
    size = 10,
    bold = false,
    color = rgb(0.1, 0.1, 0.1),
  ) => {
    page.drawText(text, { x, y, size, font: bold ? fontBold : font, color });
  };

  drawText('BuyMedicines.store', MARGIN, 18, true);
  y -= 22;
  drawText(branch.name, MARGIN, 10);
  y -= 14;
  drawText(`${branch.address}, ${branch.city}, ${branch.state} - ${branch.pincode}`, MARGIN, 9);
  y -= 14;
  if (branch.gstin) {
    drawText(`GSTIN: ${branch.gstin}`, MARGIN, 9);
    y -= 14;
  }

  y -= 10;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 20;

  drawText(`TAX INVOICE`, MARGIN, 13, true);
  drawText(`Invoice No: ${invoice.invoiceNumber}`, PAGE_WIDTH - MARGIN - 220, 10);
  y -= 16;
  drawText(`Order No: ${order.orderNumber}`, MARGIN, 10);
  drawText(`Date: ${invoice.generatedAt.toLocaleDateString('en-IN')}`, PAGE_WIDTH - MARGIN - 220, 10);
  y -= 20;

  drawText('Bill To:', MARGIN, 10, true);
  y -= 14;
  drawText(order.addressSnapshot.contactName, MARGIN, 9);
  y -= 12;
  drawText(order.addressSnapshot.line1, MARGIN, 9);
  y -= 12;
  drawText(
    `${order.addressSnapshot.city}, ${order.addressSnapshot.state} - ${order.addressSnapshot.pincode}`,
    MARGIN,
    9,
  );
  y -= 12;
  drawText(`Phone: ${order.addressSnapshot.contactPhone}`, MARGIN, 9);
  y -= 24;

  const columns = [
    { label: 'Item', x: MARGIN, width: 170 },
    { label: 'HSN', x: MARGIN + 175, width: 50 },
    { label: 'Qty', x: MARGIN + 230, width: 30 },
    { label: 'Rate', x: MARGIN + 265, width: 50 },
    { label: 'GST%', x: MARGIN + 320, width: 40 },
    { label: 'Amount', x: MARGIN + 365, width: 70 },
  ];

  for (const col of columns) drawText(col.label, col.x, 9, true);
  y -= 6;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 14;

  for (const item of order.items) {
    const amount = item.sellingPrice * item.quantity;
    drawText(item.name.slice(0, 28), columns[0]!.x, 9);
    drawText(item.hsnCode, columns[1]!.x, 9);
    drawText(String(item.quantity), columns[2]!.x, 9);
    drawText(item.sellingPrice.toFixed(2), columns[3]!.x, 9);
    drawText(`${item.gstPercentage}%`, columns[4]!.x, 9);
    drawText(amount.toFixed(2), columns[5]!.x, 9);
    y -= 16;
    if (y < 150) break;
  }

  y -= 10;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 20;

  // pdf-lib's standard fonts only support WinAnsi encoding, which has no Rupee
  // glyph (U+20B9) — "Rs." renders correctly everywhere without embedding a
  // custom Unicode font.
  const summaryX = PAGE_WIDTH - MARGIN - 200;
  drawText('Taxable Amount:', summaryX, 9);
  drawText(`Rs. ${invoice.taxableAmount.toFixed(2)}`, summaryX + 130, 9);
  y -= 14;

  if (invoice.isInterState) {
    drawText('IGST:', summaryX, 9);
    drawText(`Rs. ${invoice.igstAmount.toFixed(2)}`, summaryX + 130, 9);
    y -= 14;
  } else {
    drawText('CGST:', summaryX, 9);
    drawText(`Rs. ${invoice.cgstAmount.toFixed(2)}`, summaryX + 130, 9);
    y -= 14;
    drawText('SGST:', summaryX, 9);
    drawText(`Rs. ${invoice.sgstAmount.toFixed(2)}`, summaryX + 130, 9);
    y -= 14;
  }

  drawText('Total Amount:', summaryX, 11, true);
  drawText(`Rs. ${invoice.totalAmount.toFixed(2)}`, summaryX + 130, 11, true);

  y -= 40;
  page.drawText('This is a computer-generated invoice and does not require a signature.', {
    x: MARGIN,
    y,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
