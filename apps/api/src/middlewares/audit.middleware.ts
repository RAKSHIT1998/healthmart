import type { Request } from 'express';
import { AuditAction } from '@buymedicines/shared';
import { AuditLogModel } from '../models';
import { logger } from '../config/logger';
import type { AuthenticatedRequest } from './auth.middleware';

interface RecordAuditInput {
  req: Request;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

/** Fire-and-forget audit trail write for sensitive admin actions. Never blocks the response. */
export function recordAudit({ req, action, entityType, entityId, before, after }: RecordAuditInput): void {
  const authReq = req as AuthenticatedRequest;
  AuditLogModel.create({
    actorId: authReq.user?.id,
    actorRole: authReq.user?.role,
    action,
    entityType,
    entityId,
    before,
    after,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  }).catch((err) => logger.error({ err }, 'Failed to write audit log'));
}
