import fs from 'fs';
import path from 'path';
import type { Request, Response } from 'express';
import { MargSyncEntity, type PaginationQuery } from '@healthmart/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPaginated, sendSuccess } from '../utils/apiResponse';
import * as margSyncService from '../services/margSync.service';
import { margWebhookMapper } from '../integrations/marg/margWebhookMapper';
import { ensureDir } from '../integrations/marg/fileReader';
import { margSyncLogRepository } from '../repositories';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const { entity, records } = req.body;

  switch (entity) {
    case MargSyncEntity.MEDICINE:
    case MargSyncEntity.PRICE: {
      const payloads = records.map(margWebhookMapper.toMedicine).filter(Boolean);
      const result = await margSyncService.applyMedicinePayloads(payloads as never);
      sendSuccess(res, result, 'Medicine records processed');
      return;
    }
    case MargSyncEntity.STOCK:
    case MargSyncEntity.BATCH: {
      const payloads = records.map(margWebhookMapper.toStock).filter(Boolean);
      const result = await margSyncService.applyStockPayloads(payloads as never);
      sendSuccess(res, result, 'Stock records processed');
      return;
    }
    case MargSyncEntity.SUPPLIER: {
      const payloads = records.map(margWebhookMapper.toSupplier).filter(Boolean);
      const result = await margSyncService.applySupplierPayloads(payloads as never);
      sendSuccess(res, result, 'Supplier records processed');
      return;
    }
    default:
      sendSuccess(res, { processed: 0, failed: 0, errors: [`Unsupported entity: ${entity}`] }, 'Ignored');
  }
});

export const triggerSync = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { entity } = req.body;
  if (entity) {
    const log = await margSyncService.runSyncForEntity(entity, req.user!.id);
    sendSuccess(res, log, 'Sync triggered');
  } else {
    const logs = await margSyncService.runFullSync(req.user!.id);
    sendSuccess(res, logs, 'Full sync triggered');
  }
});

const UPLOAD_ENTITIES = new Set([MargSyncEntity.MEDICINE, MargSyncEntity.STOCK, MargSyncEntity.SUPPLIER, MargSyncEntity.CUSTOMER]);

export const uploadAndSync = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const entity = req.body.entity as MargSyncEntity;
  if (!UPLOAD_ENTITIES.has(entity)) {
    throw ApiError.badRequest('entity must be one of: medicine, stock, supplier, customer');
  }
  if (!req.file) {
    throw ApiError.badRequest('A CSV or XLSX file is required');
  }

  const watchDir = path.resolve(env.MARG_CSV_WATCH_DIR);
  ensureDir(watchDir);
  const ext = path.extname(req.file.originalname).toLowerCase() || '.csv';
  const destPath = path.join(watchDir, `${entity}-upload-${Date.now()}${ext}`);
  fs.writeFileSync(destPath, req.file.buffer);

  const log = await margSyncService.runSyncFromUpload(entity, req.user!.id);
  sendSuccess(res, log, 'File uploaded and synced');
});

export const listLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, pagination } = await margSyncLogRepository.listRecent(page, limit);
  sendPaginated(res, items, pagination);
});
