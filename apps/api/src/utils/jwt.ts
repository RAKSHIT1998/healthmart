import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { TOKEN_CONFIG, type JwtAccessPayload } from '@healthmart/shared';

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  tokenVersion: number;
}

export function signAccessToken(payload: JwtAccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY,
  });
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
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
