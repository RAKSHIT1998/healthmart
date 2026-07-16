import type { Request, Response } from 'express';
import { logger } from '../config/logger';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

function pickString(payload: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

export const receiveEmailEvent = asyncHandler(async (req: Request, res: Response) => {
  const payload = (req.body ?? {}) as Record<string, unknown>;

  logger.info(
    {
      provider: 'hostinger',
      event: pickString(payload, ['event', 'type', 'eventType', 'status']),
      messageId: pickString(payload, ['messageId', 'message_id', 'id', 'emailId']),
      recipient: pickString(payload, ['recipient', 'to', 'email', 'emailAddress']),
      payload,
    },
    'Hostinger email webhook received',
  );

  sendSuccess(res, { received: true }, 'Hostinger email webhook received');
});
