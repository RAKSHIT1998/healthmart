import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

/**
 * Verifies the `X-Marg-Signature` header: hex HMAC-SHA256 of the raw request body
 * using MARG_WEBHOOK_SECRET. Marg Compusoft (or whatever intermediary relays the
 * push) must sign payloads with the same shared secret configured in `.env`.
 */
export function verifyMargWebhookSignature(req: Request, _res: Response, next: NextFunction): void {
  const signature = req.headers['x-marg-signature'];
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!signature || typeof signature !== 'string' || !rawBody) {
    next(ApiError.unauthorized('Missing webhook signature'));
    return;
  }

  const expected = crypto.createHmac('sha256', env.MARG_WEBHOOK_SECRET).update(rawBody).digest('hex');

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    next(ApiError.unauthorized('Invalid webhook signature'));
    return;
  }

  next();
}
