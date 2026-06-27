import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import * as reportService from '../services/report.service';

function parseDateRange(req: Request): { from: Date; to: Date } {
  const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = req.query.to ? new Date(req.query.to as string) : new Date();
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
