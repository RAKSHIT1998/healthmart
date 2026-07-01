import crypto from 'crypto';
import { env } from '../config/env';
import { logger } from '../config/logger';

const CASHFREE_BASE_URL =
  env.CASHFREE_ENV === 'PRODUCTION' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

const API_VERSION = '2023-08-01';

function assertConfigured(): void {
  if (!env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY) {
    throw new Error(
      'Cashfree is not configured. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in .env.',
    );
  }
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-version': API_VERSION,
    'x-client-id': env.CASHFREE_APP_ID ?? '',
    'x-client-secret': env.CASHFREE_SECRET_KEY ?? '',
  };
}

export interface CreateCashfreeOrderParams {
  orderId: string;
  amount: number;
  customerId: string;
  customerPhone: string;
  customerEmail?: string;
  returnUrl: string;
}

export interface CreateCashfreeOrderResult {
  cfOrderId: string;
  paymentSessionId: string;
}

export async function createCashfreeOrder(
  params: CreateCashfreeOrderParams,
): Promise<CreateCashfreeOrderResult> {
  assertConfigured();

  const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      order_id: params.orderId,
      order_amount: params.amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: params.customerId,
        customer_phone: params.customerPhone,
        customer_email: params.customerEmail || 'guest@buymedicines.store',
      },
      order_meta: {
        return_url: `${params.returnUrl}?order_id={order_id}`,
      },
    }),
  });

  const body = await response.json();

  if (!response.ok) {
    logger.error({ body }, 'Cashfree order creation failed');
    throw new Error((body as { message?: string }).message || 'Failed to create Cashfree order');
  }

  return {
    cfOrderId: (body as { cf_order_id: string }).cf_order_id,
    paymentSessionId: (body as { payment_session_id: string }).payment_session_id,
  };
}

export async function getCashfreeOrderStatus(orderId: string): Promise<string> {
  assertConfigured();

  const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error((body as { message?: string }).message || 'Failed to fetch Cashfree order status');
  }

  return (body as { order_status: string }).order_status;
}

/**
 * Verifies the `x-webhook-signature` header Cashfree sends with every webhook call.
 * signature = base64(HMAC-SHA256(timestamp + rawBody, CASHFREE_SECRET_KEY))
 */
export function verifyCashfreeWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
): boolean {
  const secret = env.CASHFREE_WEBHOOK_SECRET || env.CASHFREE_SECRET_KEY;
  if (!secret) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(timestamp + rawBody)
    .digest('base64');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function initiateCashfreeRefund(
  orderId: string,
  refundAmount: number,
  refundId: string,
): Promise<void> {
  assertConfigured();

  const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}/refunds`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      refund_amount: refundAmount,
      refund_id: refundId,
      refund_note: 'Order cancellation refund',
    }),
  });

  if (!response.ok) {
    const body = await response.json();
    logger.error({ body }, 'Cashfree refund failed');
    throw new Error((body as { message?: string }).message || 'Failed to initiate refund');
  }
}
