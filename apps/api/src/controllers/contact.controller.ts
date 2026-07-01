import type { Request, Response } from 'express';
import type { ContactMessageInput } from '@buymedicines/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { sendEmail } from '../integrations/resend';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const submit = asyncHandler(async (req: Request, res: Response) => {
  const { name, contact, message } = req.body as ContactMessageInput;

  logger.info({ name, contact }, 'Contact form submission received');

  await sendEmail({
    to: env.ADMIN_SEED_EMAIL,
    subject: `Contact form: ${name}`,
    html: `<p><strong>From:</strong> ${name} (${contact})</p><p>${message.replace(/\n/g, '<br/>')}</p>`,
  });

  sendSuccess(res, null, "Thanks for reaching out! We'll get back to you within 24 hours.");
});
