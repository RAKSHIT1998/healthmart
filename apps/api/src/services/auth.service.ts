import type { Request } from 'express';
import { Role, TOKEN_CONFIG, type SendOtpInput, type StaffLoginInput, type VerifyOtpInput } from '@buymedicines/shared';
import { OtpModel, RefreshTokenModel, UserModel, type IUser } from '../models';
import { userRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import { comparePassword } from '../utils/hash';
import { generateOtp, otpExpiryDate } from '../utils/otp';
import { hashToken, generateTokenId, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendOtpSms } from '../integrations/msg91';
import { sendOtpEmail } from '../integrations/resend';
import { getOtpBypassEnabled } from './systemSetting.service';
import { OTP_CONFIG } from '@buymedicines/shared';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

function hashOtp(otp: string): string {
  return hashToken(otp);
}

export async function requestOtp({ phone, email, purpose }: SendOtpInput): Promise<void> {
  const identifier = phone ? { phone } : { email };
  const recentOtp = await OtpModel.findOne({ ...identifier, purpose }).sort({ createdAt: -1 });
  if (recentOtp && Date.now() - recentOtp.createdAt.getTime() < OTP_CONFIG.RESEND_COOLDOWN_SECONDS * 1000) {
    throw ApiError.tooManyRequests('Please wait before requesting another OTP');
  }

  const otp = generateOtp();
  await OtpModel.create({
    ...identifier,
    purpose,
    otpHash: hashOtp(otp),
    expiresAt: otpExpiryDate(),
  });

  if (phone) {
    await sendOtpSms({ phone, otp });
  } else {
    await sendOtpEmail(email!, otp);
  }
}

async function issueTokenPair(user: IUser, req: Request, family?: string): Promise<TokenPair> {
  const jti = generateTokenId();
  const tokenFamily = family ?? jti;

  const refreshToken = signRefreshToken({ sub: String(user._id), jti, tokenVersion: user.tokenVersion });
  await RefreshTokenModel.create({
    userId: user._id,
    jti,
    tokenHash: hashToken(refreshToken),
    family: tokenFamily,
    expiresAt: new Date(Date.now() + TOKEN_CONFIG.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  const accessToken = signAccessToken({
    sub: String(user._id),
    role: user.role,
    branchId: user.branchId ? String(user.branchId) : undefined,
    tokenVersion: user.tokenVersion,
  });

  return { accessToken, refreshToken, expiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY };
}

export async function verifyOtpAndAuthenticate(
  input: VerifyOtpInput,
  req: Request,
): Promise<{ user: IUser; tokens: TokenPair; isNewUser: boolean }> {
  const identifier = input.phone ? { phone: input.phone } : { email: input.email };
  const otpRecord = await OtpModel.findOne({ ...identifier, verified: false }).sort({ createdAt: -1 });

  if (!otpRecord) {
    throw ApiError.badRequest('No pending OTP request found');
  }
  if (otpRecord.expiresAt < new Date()) {
    throw ApiError.badRequest('OTP has expired, please request a new one');
  }
  if (otpRecord.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
    throw ApiError.badRequest('Maximum OTP attempts exceeded, please request a new one');
  }

  // Admin-toggleable escape hatch for when SMS/email delivery isn't configured yet —
  // accepts any correctly-formatted code instead of checking it against the real OTP.
  const bypassActive = await getOtpBypassEnabled();
  if (!bypassActive && otpRecord.otpHash !== hashOtp(input.otp)) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw ApiError.badRequest('Invalid OTP');
  }

  otpRecord.verified = true;
  await otpRecord.save();

  let user = input.phone ? await userRepository.findByPhone(input.phone) : await userRepository.findByEmail(input.email!);
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = await UserModel.create({
      name: input.name || 'Customer',
      phone: input.phone,
      email: input.email,
      role: Role.CUSTOMER,
      isPhoneVerified: Boolean(input.phone),
      isEmailVerified: Boolean(input.email),
    });
  } else {
    if (input.phone && !user.isPhoneVerified) user.isPhoneVerified = true;
    if (input.email && !user.isEmailVerified) user.isEmailVerified = true;
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueTokenPair(user, req);
  return { user, tokens, isNewUser };
}

export async function staffLogin(input: StaffLoginInput, req: Request): Promise<{ user: IUser; tokens: TokenPair }> {
  const user = await userRepository.findByEmail(input.email);
  if (!user || !user.passwordHash) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Contact an administrator.');
  }

  const isValid = await comparePassword(input.password, user.passwordHash);
  if (!isValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueTokenPair(user, req);
  return { user, tokens };
}

export async function refreshAccessToken(refreshToken: string, req: Request): Promise<TokenPair> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const stored = await RefreshTokenModel.findOne({ jti: payload.jti });
  if (!stored || stored.tokenHash !== hashToken(refreshToken)) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  if (stored.revoked) {
    // Reuse of a revoked token indicates token theft — revoke the entire family.
    await RefreshTokenModel.updateMany({ family: stored.family }, { $set: { revoked: true } });
    throw ApiError.unauthorized('Refresh token has been revoked. Please log in again.');
  }

  const user = await UserModel.findById(stored.userId);
  if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
    throw ApiError.unauthorized('Session is no longer valid');
  }

  stored.revoked = true;
  const newJti = generateTokenId();
  stored.replacedByJti = newJti;
  await stored.save();

  const newRefreshToken = signRefreshToken({ sub: String(user._id), jti: newJti, tokenVersion: user.tokenVersion });
  await RefreshTokenModel.create({
    userId: user._id,
    jti: newJti,
    tokenHash: hashToken(newRefreshToken),
    family: stored.family,
    expiresAt: new Date(Date.now() + TOKEN_CONFIG.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  const accessToken = signAccessToken({
    sub: String(user._id),
    role: user.role,
    branchId: user.branchId ? String(user.branchId) : undefined,
    tokenVersion: user.tokenVersion,
  });

  return { accessToken, refreshToken: newRefreshToken, expiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY };
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    const payload = verifyRefreshToken(refreshToken);
    await RefreshTokenModel.updateOne({ jti: payload.jti }, { $set: { revoked: true } });
  } catch {
    // Already invalid/expired — nothing to revoke.
  }
}

export async function logoutAllDevices(userId: string): Promise<void> {
  await Promise.all([
    RefreshTokenModel.updateMany({ userId }, { $set: { revoked: true } }),
    userRepository.incrementTokenVersion(userId),
  ]);
}

export async function sendOtpFallbackEmail(email: string, otp: string): Promise<void> {
  await sendOtpEmail(email, otp);
}
