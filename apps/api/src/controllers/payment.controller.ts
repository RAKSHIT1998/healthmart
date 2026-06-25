import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { verifyCashfreeWebhookSignature } from '../integrations/cashfree';
import { processCashfreeWebhook, getOrderPaymentStatus } from '../services/payment.service';
import { logger } from '../config/logger';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const cashfreeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-webhook-signature'] as string | undefined;
  const timestamp = req.headers['x-webhook-timestamp'] as string | undefined;
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!signature || !timestamp || !rawBody) {
    throw ApiError.badRequest('Missing webhook signature headers');
  }

  const isValid = verifyCashfreeWebhookSignature(rawBody.toString('utf-8'), timestamp, signature);
  if (!isValid) {
    logger.warn('Rejected Cashfree webhook with invalid signature');
    throw ApiError.unauthorized('Invalid webhook signature');
  }

  await processCashfreeWebhook(req.body);
  sendSuccess(res, null, 'Webhook processed');
});

export const checkStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const status = await getOrderPaymentStatus(req.params.orderId as string);
  sendSuccess(res, status);
});
