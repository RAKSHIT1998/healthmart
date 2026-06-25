import { env } from '../config/env';
import { logger } from '../config/logger';

const MSG91_BASE_URL = 'https://control.msg91.com/api/v5';

interface SendOtpSmsParams {
  phone: string;
  otp: string;
}

/**
 * Sends an OTP SMS via MSG91's OTP API. Requires MSG91_AUTH_KEY, MSG91_SENDER_ID,
 * and MSG91_OTP_TEMPLATE_ID (a DLT-approved template containing the `##OTP##` variable)
 * to be configured. In development without credentials, logs the OTP instead of sending.
 */
export async function sendOtpSms({ phone, otp }: SendOtpSmsParams): Promise<void> {
  if (!env.MSG91_AUTH_KEY || !env.MSG91_OTP_TEMPLATE_ID) {
    logger.warn(`[MSG91 not configured] OTP for ${phone}: ${otp}`);
    return;
  }

  const mobile = phone.replace(/^\+?91/, '91').replace(/\D/g, '');
  const url = new URL(`${MSG91_BASE_URL}/otp`);
  url.searchParams.set('template_id', env.MSG91_OTP_TEMPLATE_ID);
  url.searchParams.set('mobile', mobile);
  url.searchParams.set('authkey', env.MSG91_AUTH_KEY);
  url.searchParams.set('otp', otp);
  if (env.MSG91_SENDER_ID) {
    url.searchParams.set('sender', env.MSG91_SENDER_ID);
  }

  const response = await fetch(url.toString(), { method: 'POST' });
  const body = await response.json().catch(() => ({}));

  if (!response.ok || (body as { type?: string }).type === 'error') {
    logger.error({ body }, 'MSG91 OTP send failed');
    throw new Error('Failed to send OTP SMS');
  }
}

/** Sends a transactional SMS (e.g. order updates) via MSG91's flow API. */
export async function sendTransactionalSms(
  phone: string,
  flowId: string,
  variables: Record<string, string>,
): Promise<void> {
  if (!env.MSG91_AUTH_KEY) {
    logger.warn(`[MSG91 not configured] SMS to ${phone}: ${JSON.stringify(variables)}`);
    return;
  }

  const mobile = phone.replace(/^\+?91/, '91').replace(/\D/g, '');
  const response = await fetch(`${MSG91_BASE_URL}/flow/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authkey: env.MSG91_AUTH_KEY },
    body: JSON.stringify({
      flow_id: flowId,
      recipients: [{ mobiles: mobile, ...variables }],
    }),
  });

  if (!response.ok) {
    logger.error({ status: response.status }, 'MSG91 transactional SMS failed');
  }
}
