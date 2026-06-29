import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import * as reportService from '../services/report.service';

// The business operates in India; a plain "YYYY-MM-DD" from/to query param means that IST
// calendar date, not UTC midnight of that date — without this offset, "to" lands at 5:30am IST
// and silently excludes the rest of that day's orders/invoices from the report.
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

function startOfIstDay(dateOnly: string): Date {
  return new Date(new Date(`${dateOnly.slice(0, 10)}T00:00:00.000Z`).getTime() - IST_OFFSET_MS);
}

function endOfIstDay(dateOnly: string): Date {
  return new Date(new Date(`${dateOnly.slice(0, 10)}T23:59:59.999Z`).getTime() - IST_OFFSET_MS);
}

function parseDateRange(req: Request): { from: Date; to: Date } {
  const fromParam = req.query.from as string | undefined;
  const toParam = req.query.to as string | undefined;
  const from = fromParam ? startOfIstDay(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = toParam ? endOfIstDay(toParam) : new Date();
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw ApiError.badRequest('Invalid from/to date');
  }
  return { from, to };
}

function respond(req: Request, res: Response, rows: unknown[], csv: string, filename: string) {
  if (req.query.format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    res.send(csv);
    return;
  }
  sendSuccess(res, rows);
}

export const sales = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = parseDateRange(req);
  const { rows, csv } = await reportService.getSalesReport(from, to, req.query.branchId as string | undefined);
  respond(req, res, rows, csv, 'sales-report');
});

export const gst = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = parseDateRange(req);
  const { rows, csv } = await reportService.getGstReport(from, to);
  respond(req, res, rows, csv, 'gst-report');
});

export const stock = asyncHandler(async (req: Request, res: Response) => {
  const { rows, csv } = await reportService.getStockReport(req.query.branchId as string | undefined);
  respond(req, res, rows, csv, 'stock-report');
});

export const expiry = asyncHandler(async (req: Request, res: Response) => {
  const { rows, csv } = await reportService.getExpiryReport(req.query.branchId as string | undefined, Number(req.query.days) || undefined);
  respond(req, res, rows, csv, 'expiry-report');
});
