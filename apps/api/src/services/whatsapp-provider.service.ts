import { env } from '../config/env';
import { logger } from '../config/logger';
import { sendWhatsAppMessage } from '../integrations/msg91';
import { sendOpenWADocument, sendOpenWALocation, sendOpenWAText } from '../integrations/openwa';

export async function sendWhatsAppText(params: {
  phone: string;
  text: string;
  templateName?: string;
  bodyParams?: string[];
}): Promise<void> {
  if (env.WHATSAPP_PROVIDER === 'openwa') {
    await sendOpenWAText(params.phone, params.text);
    return;
  }

  await sendWhatsAppMessage({
    phone: params.phone,
    templateName: params.templateName,
    bodyParams: params.bodyParams ?? [params.text],
  });
}

export async function sendWhatsAppDocument(params: {
  phone: string;
  url: string;
  filename: string;
  caption?: string;
}): Promise<void> {
  if (env.WHATSAPP_PROVIDER !== 'openwa') {
    logger.warn({ phone: params.phone }, 'WhatsApp document send is only implemented for OpenWA; skipping');
    return;
  }

  await sendOpenWADocument(params);
}

export async function sendWhatsAppLocation(params: {
  phone: string;
  latitude: number;
  longitude: number;
  description?: string;
  address?: string;
}): Promise<void> {
  if (env.WHATSAPP_PROVIDER !== 'openwa') {
    logger.warn({ phone: params.phone }, 'WhatsApp location send is only implemented for OpenWA; skipping');
    return;
  }

  await sendOpenWALocation(params);
}
