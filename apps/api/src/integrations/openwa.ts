import { env } from '../config/env';
import { logger } from '../config/logger';

function normalizeDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length > 10) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function toChatId(phone: string): string {
  return `${normalizeDigits(phone)}@c.us`;
}

function getBaseConfig() {
  if (!env.OPENWA_BASE_URL || !env.OPENWA_API_KEY || !env.OPENWA_SESSION_ID) return null;
  return {
    baseUrl: env.OPENWA_BASE_URL.replace(/\/$/, ''),
    apiKey: env.OPENWA_API_KEY,
    sessionId: env.OPENWA_SESSION_ID,
  };
}

async function openwaFetch(path: string, body: Record<string, unknown>): Promise<void> {
  const config = getBaseConfig();
  if (!config) {
    logger.warn({ path }, '[OpenWA not configured] WhatsApp message skipped');
    return;
  }

  const response = await fetch(`${config.baseUrl}/sessions/${config.sessionId}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    logger.error({ path, status: response.status, errorBody }, 'OpenWA send failed');
    throw new Error(`OpenWA request failed with status ${response.status}`);
  }
}

export async function sendOpenWAText(phone: string, text: string): Promise<void> {
  await openwaFetch('/messages/send-text', {
    chatId: toChatId(phone),
    text,
  });
}

export async function sendOpenWADocument(params: {
  phone: string;
  url: string;
  filename: string;
  caption?: string;
  mimetype?: string;
}): Promise<void> {
  await openwaFetch('/messages/send-document', {
    chatId: toChatId(params.phone),
    url: params.url,
    filename: params.filename,
    caption: params.caption,
    mimetype: params.mimetype ?? 'application/pdf',
  });
}

export async function sendOpenWALocation(params: {
  phone: string;
  latitude: number;
  longitude: number;
  description?: string;
  address?: string;
}): Promise<void> {
  await openwaFetch('/messages/send-location', {
    chatId: toChatId(params.phone),
    latitude: params.latitude,
    longitude: params.longitude,
    description: params.description,
    address: params.address,
  });
}
