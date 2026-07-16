import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

function normalizeSignature(signature: string): string {
  return signature.replace(/^sha256=/i, '').trim();
}

export function verifyHostingerEmailWebhook(req: Request, _res: Response, next: NextFunction): void {
  if (!env.HOSTINGER_EMAIL_WEBHOOK_SECRET) {
    next();
    return;
  }

  const signature =
    req.headers['x-hostinger-signature'] ||
    req.headers['x-webhook-signature'] ||
    req.headers['x-signature'];
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!signature || typeof signature !== 'string' || !rawBody) {
    next(ApiError.unauthorized('Missing webhook signature'));
    return;
  }

  const expected = crypto
    .createHmac('sha256', env.HOSTINGER_EMAIL_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  const provided = normalizeSignature(signature);
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    next(ApiError.unauthorized('Invalid webhook signature'));
    return;
  }

  next();
}
