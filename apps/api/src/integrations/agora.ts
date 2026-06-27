import { RtcRole, RtcTokenBuilder } from 'agora-token';
import { env } from '../config/env';

const TOKEN_EXPIRY_SECONDS = 60 * 60; // 1 hour — enough for a single consultation

export interface VideoTokenResult {
  appId: string;
  channelName: string;
  token: string;
  uid: string;
  expiresInSeconds: number;
}

/**
 * Generates a per-user Agora RTC token for a consultation channel. Requires
 * AGORA_APP_ID + AGORA_APP_CERTIFICATE (from the Agora Console for your
 * project) — without them, video/audio consultation cannot start, and this
 * throws clearly rather than silently degrading, since there's no sensible
 * fallback for a live call.
 */
export function generateVideoToken(channelName: string, accountId: string): VideoTokenResult {
  if (!env.AGORA_APP_ID || !env.AGORA_APP_CERTIFICATE) {
    throw new Error('Video consultation is not configured. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE in .env.');
  }

  const expireAt = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS;

  const token = RtcTokenBuilder.buildTokenWithUserAccount(
    env.AGORA_APP_ID,
    env.AGORA_APP_CERTIFICATE,
    channelName,
    accountId,
    RtcRole.PUBLISHER,
    expireAt,
    expireAt,
  );

  return {
    appId: env.AGORA_APP_ID,
    channelName,
    token,
    uid: accountId,
    expiresInSeconds: TOKEN_EXPIRY_SECONDS,
  };
}
