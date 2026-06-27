import type { Request, Response } from 'express';
import { MargSyncEntity, type PaginationQuery } from '@healthmart/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPaginated, sendSuccess } from '../utils/apiResponse';
import * as margSyncService from '../services/margSync.service';
import { margWebhookMapper } from '../integrations/marg/margWebhookMapper';
import { margSyncLogRepository } from '../repositories';
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

export const listLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, pagination } = await margSyncLogRepository.listRecent(page, limit);
  sendPaginated(res, items, pagination);
});
