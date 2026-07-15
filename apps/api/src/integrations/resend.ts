import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../config/env';
import { logger } from '../config/logger';

const resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const smtpTransporter =
  env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT ?? 465,
        secure: env.SMTP_SECURE ?? true,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      })
    : null;

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

function senderEmail(): string {
  return env.MAIL_FROM_EMAIL || env.RESEND_FROM_EMAIL;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function appEmailShell(params: {
  previewText?: string;
  headline: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  const { previewText, headline, bodyHtml, ctaLabel, ctaUrl, footerNote } = params;
  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${previewText ?? headline}</div>
    <div style="margin:0;padding:24px;background:#f6f3ee;font-family:Arial,sans-serif;color:#1f2937;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #eadfce;">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#164e63,#0f766e);color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.85;">BuyMedicines.store</div>
          <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;">${headline}</h1>
        </div>
        <div style="padding:28px 32px;font-size:15px;line-height:1.7;color:#334155;">
          ${bodyHtml}
          ${
            ctaLabel && ctaUrl
              ? `<div style="margin-top:24px;"><a href="${ctaUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;">${ctaLabel}</a></div>`
              : ''
          }
          <div style="margin-top:28px;font-size:12px;color:#64748b;">
            ${footerNote ?? 'You are receiving this email from BuyMedicines.store.'}
          </div>
        </div>
      </div>
    </div>`;
}

export async function sendEmail({ to, subject, html, text, attachments }: SendEmailParams): Promise<void> {
  if (smtpTransporter) {
    await smtpTransporter.sendMail({
      from: senderEmail(),
      to,
      subject,
      html,
      text: text ?? stripHtml(html),
      attachments,
    });
    return;
  }

  if (!resendClient) {
    logger.warn(`[Mail provider not configured] Email to ${to} - ${subject}`);
    return;
  }

  const { error } = await resendClient.emails.send({
    from: senderEmail(),
    to,
    subject,
    html,
    text: text ?? stripHtml(html),
    attachments: attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: typeof attachment.content === 'string' ? attachment.content : attachment.content.toString('base64'),
    })),
  });

  if (error) {
    logger.error({ error }, 'Email send failed');
    throw new Error('Failed to send email');
  }
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  await sendEmail({
    to,
    subject: 'Your BuyMedicines.store verification code',
    html: appEmailShell({
      previewText: `Your OTP is ${otp}`,
      headline: 'Your verification code',
      bodyHtml: `<p>Your one-time password is <strong>${otp}</strong>.</p><p>It expires in 10 minutes. If you didn&apos;t request this, you can ignore this email.</p>`,
      footerNote: 'This is a transactional security email from BuyMedicines.store.',
    }),
  });
}

export async function sendOrderConfirmationEmail(to: string, orderNumber: string, totalAmount: number): Promise<void> {
  await sendEmail({
    to,
    subject: `Order Confirmed - ${orderNumber}`,
    html: appEmailShell({
      previewText: `Order ${orderNumber} confirmed`,
      headline: 'Order placed successfully',
      bodyHtml: `<p>Thank you for your order.</p><p>Your order <strong>${orderNumber}</strong> for <strong>&#8377;${totalAmount.toFixed(
        2,
      )}</strong> has been placed successfully.</p><p>We&apos;ll keep you updated as it moves through packing and delivery.</p>`,
      ctaLabel: 'Track your order',
      ctaUrl: `${env.SITE_URL}/account/orders`,
      footerNote: 'This is a transactional order update from BuyMedicines.store.',
    }),
  });
}

export async function sendInvoiceEmail(params: {
  to: string;
  customerName?: string;
  orderNumber: string;
  invoiceNumber: string;
  pdfUrl?: string;
  pdfBase64?: string;
}): Promise<void> {
  const { to, customerName, orderNumber, invoiceNumber, pdfUrl, pdfBase64 } = params;
  await sendEmail({
    to,
    subject: `Invoice ${invoiceNumber} for order ${orderNumber}`,
    html: appEmailShell({
      previewText: `Invoice ${invoiceNumber}`,
      headline: 'Your invoice is ready',
      bodyHtml: `<p>Hi ${customerName || 'there'},</p><p>Your invoice <strong>${invoiceNumber}</strong> for order <strong>${orderNumber}</strong> is ready.</p><p>${
        pdfUrl ? 'You can open it using the button below.' : 'We have attached the invoice PDF to this email.'
      }</p>`,
      ctaLabel: pdfUrl ? 'Open invoice' : undefined,
      ctaUrl: pdfUrl,
      footerNote: 'This is a transactional billing email from BuyMedicines.store.',
    }),
    attachments:
      !pdfUrl && pdfBase64
        ? [
            {
              filename: `${invoiceNumber.replace(/[^\w.-]+/g, '_')}.pdf`,
              content: Buffer.from(pdfBase64, 'base64'),
              contentType: 'application/pdf',
            },
          ]
        : undefined,
  });
}

export async function sendMarketingCampaignEmail(params: {
  to: string;
  subject: string;
  previewText?: string;
  headline: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): Promise<void> {
  await sendEmail({
    to: params.to,
    subject: params.subject,
    html: appEmailShell({
      previewText: params.previewText,
      headline: params.headline,
      bodyHtml: params.body
        .split(/\n{2,}/)
        .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br/>')}</p>`)
        .join(''),
      ctaLabel: params.ctaLabel,
      ctaUrl: params.ctaUrl,
      footerNote:
        'You are receiving this because email updates are enabled on your BuyMedicines.store account.',
    }),
  });
}
