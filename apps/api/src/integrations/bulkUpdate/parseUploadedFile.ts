import path from 'path';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { extractPdfText } from './extractPdfText';
import { ApiError } from '../../utils/ApiError';

export type FileRow = Record<string, string>;

/** Picks the first delimiter that splits the header line into more than one column. */
function sniffDelimiter(firstLine: string): string {
  const candidates = [',', '\t', ';', '|'];
  for (const delimiter of candidates) {
    if (firstLine.split(delimiter).length > 1) return delimiter;
  }
  return ',';
}

function parseDelimitedText(content: string): FileRow[] {
  const firstLine = content.split(/\r?\n/).find((line) => line.trim().length > 0) ?? '';
  const delimiter = sniffDelimiter(firstLine);
  return parse(content, { columns: true, skip_empty_lines: true, trim: true, delimiter }) as FileRow[];
}

async function parsePdf(buffer: Buffer): Promise<FileRow[]> {
  let text: string;
  try {
    text = await extractPdfText(buffer);
  } catch {
    // Can't read every PDF structure (e.g. scanned/image-only pages, encrypted PDFs) —
    // surface this as a clean, actionable 400 instead of a 500.
    throw ApiError.badRequest(
      'Could not read this PDF. Make sure it contains selectable text (not a scanned image), or re-upload as CSV/XLSX instead.',
    );
  }
  const content = text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .join('\n');
  if (!content) return [];
  return parseDelimitedText(content);
}

/** Parses an uploaded bulk-update file (xlsx/xls/csv/txt/pdf) from a buffer into header-keyed row objects. */
export async function parseUploadedFile(buffer: Buffer, originalName: string): Promise<FileRow[]> {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json<FileRow>(sheet, { raw: false, defval: '' });
  }

  if (ext === '.csv' || ext === '.txt') {
    return parseDelimitedText(buffer.toString('utf-8'));
  }

  if (ext === '.pdf') {
    return parsePdf(buffer);
  }

  throw ApiError.badRequest(`Unsupported file type: ${ext || '(unknown)'}. Upload a .xlsx, .csv, .txt, or .pdf file.`);
}

function str(row: FileRow, ...keys: string[]): string | undefined {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== '') return String(row[key]).trim();
  }
  return undefined;
}

function num(row: FileRow, ...keys: string[]): number | undefined {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== '') {
      const value = Number(row[key]);
      return Number.isNaN(value) ? undefined : value;
    }
  }
  return undefined;
}

function bool(row: FileRow, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== '') {
      const value = String(row[key]).trim().toLowerCase();
      if (['true', 'yes', '1', 'active'].includes(value)) return true;
      if (['false', 'no', '0', 'inactive'].includes(value)) return false;
    }
  }
  return undefined;
}

export interface BulkUpdateFileRow {
  identifier?: string;
  name?: string;
  mrp?: number;
  sellingPrice?: number;
  stockQuantity?: number;
  gstPercentage?: number;
  hsnCode?: string;
  packSize?: string;
  isActive?: boolean;
}

/**
 * Maps a flexibly-headed raw row (any of several common column-name spellings) into the
 * normalized field set the bulk-update preview/commit flow understands. Mirrors the
 * str()/num() header-matching pattern used by MargCsvAdapter for the same reason: different
 * exports (and now different admins' spreadsheets) spell these headers differently.
 */
export function normalizeBulkUpdateRow(row: FileRow): BulkUpdateFileRow {
  return {
    identifier: str(row, 'SKU', 'Sku', 'Item Code', 'ItemCode', 'MargItemCode', 'Code'),
    name: str(row, 'Name', 'Product Name', 'Medicine Name', 'Item Name', 'ItemName'),
    mrp: num(row, 'MRP', 'Mrp'),
    sellingPrice: num(row, 'Selling Price', 'SellingPrice', 'Price', 'Rate'),
    stockQuantity: num(row, 'Stock', 'Stock Quantity', 'StockQuantity', 'Quantity', 'Qty'),
    gstPercentage: num(row, 'GST', 'GST%', 'GstPercentage', 'GST Percentage'),
    hsnCode: str(row, 'HSN', 'HSN Code', 'HsnCode'),
    packSize: str(row, 'Pack Size', 'PackSize', 'Pack'),
    isActive: bool(row, 'Active', 'IsActive', 'Status'),
  };
}
