import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { TOKEN_CONFIG, type JwtAccessPayload } from '@buymedicines/shared';

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  tokenVersion: number;
}

export function signAccessToken(payload: JwtAccessPayload): string {
  if (!env.JWT_ACCESS_SECRET) throw new Error('JWT_ACCESS_SECRET is not set in Railway Variables');
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY,
  });
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  if (!env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is not set in Railway Variables');
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: `${TOKEN_CONFIG.REFRESH_TOKEN_EXPIRY_DAYS}d`,
  });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateTokenId(): string {
  return crypto.randomBytes(24).toString('hex');
}
