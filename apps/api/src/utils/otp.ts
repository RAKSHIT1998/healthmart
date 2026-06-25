import crypto from 'crypto';
import { OTP_CONFIG } from '@healthmart/shared';

export function generateOtp(): string {
  const max = 10 ** OTP_CONFIG.LENGTH;
  const num = crypto.randomInt(0, max);
  return num.toString().padStart(OTP_CONFIG.LENGTH, '0');
}

export function otpExpiryDate(): Date {
  return new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);
}
