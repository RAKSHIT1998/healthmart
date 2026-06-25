import { Resend } from 'resend';
import { env } from '../config/env';
import { logger } from '../config/logger';

const resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  if (!resendClient) {
    logger.warn(`[Resend not configured] Email to ${to} - ${subject}`);
    return;
  }

  const { error } = await resendClient.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    logger.error({ error }, 'Resend email send failed');
    throw new Error('Failed to send email');
  }
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  await sendEmail({
    to,
    subject: 'Your Medicare Medical Store verification code',
    html: `<p>Your one-time password is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
  });
}

export async function sendOrderConfirmationEmail(
  to: string,
  orderNumber: string,
  totalAmount: number,
): Promise<void> {
  await sendEmail({
    to,
    subject: `Order Confirmed - ${orderNumber}`,
    html: `<p>Thank you for your order! Your order <strong>${orderNumber}</strong> for &#8377;${totalAmount.toFixed(
      2,
    )} has been placed successfully.</p>`,
  });
}
