import type { Request } from 'express';
import {
  OTP_CONFIG,
  Role,
  TOKEN_CONFIG,
  type CustomerLoginInput,
  type CustomerSignupInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type SendOtpInput,
  type StaffLoginInput,
  type VerifyOtpInput,
} from '@buymedicines/shared';
import { sendOtpSms } from '../integrations/msg91';
import { sendOtpEmail } from '../integrations/resend';
import { OtpModel, RefreshTokenModel, UserModel, type IUser } from '../models';
import { userRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import { comparePassword, hashPassword } from '../utils/hash';
import { hashToken, generateTokenId, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateOtp, otpExpiryDate } from '../utils/otp';
import { getOtpBypassEnabled } from './systemSetting.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

function hashOtp(otp: string): string {
  return hashToken(otp);
}

function normalizeIdentifier<T extends { phone?: string; email?: string }>(input: T): T {
  const normalized = { ...input };
  if (normalized.phone) normalized.phone = normalized.phone.replace(/^\+91/, '');
  if (normalized.email) normalized.email = normalized.email.trim().toLowerCase();
  return normalized;
}

async function findUserByIdentifier({ phone, email }: { phone?: string; email?: string }) {
  return phone ? userRepository.findByPhone(phone) : userRepository.findByEmail(email!);
}

async function validateOtpRecord({
  phone,
  email,
  purpose,
  otp,
}: {
  phone?: string;
  email?: string;
  purpose: SendOtpInput['purpose'];
  otp: string;
}) {
  const identifier = phone ? { phone } : { email };
  const otpRecord = await OtpModel.findOne({ ...identifier, purpose, verified: false }).sort({ createdAt: -1 });

  if (!otpRecord) throw ApiError.badRequest('No pending OTP request found');
  if (otpRecord.expiresAt < new Date()) throw ApiError.badRequest('OTP has expired, please request a new one');
  if (otpRecord.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
    throw ApiError.badRequest('Maximum OTP attempts exceeded, please request a new one');
  }

  const bypassActive = await getOtpBypassEnabled();
  if (!bypassActive && otpRecord.otpHash !== hashOtp(otp)) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw ApiError.badRequest('Invalid OTP');
  }

  otpRecord.verified = true;
  await otpRecord.save();
  return otpRecord;
}

export async function requestOtp({ phone, email, purpose }: SendOtpInput): Promise<void> {
  const normalized = normalizeIdentifier({ phone, email, purpose });
  const identifier = normalized.phone ? { phone: normalized.phone } : { email: normalized.email };
  const recentOtp = await OtpModel.findOne({ ...identifier, purpose: normalized.purpose }).sort({ createdAt: -1 });
  if (recentOtp && Date.now() - recentOtp.createdAt.getTime() < OTP_CONFIG.RESEND_COOLDOWN_SECONDS * 1000) {
    throw ApiError.tooManyRequests('Please wait before requesting another OTP');
  }

  const otp = generateOtp();
  await OtpModel.create({
    ...identifier,
    purpose: normalized.purpose,
    otpHash: hashOtp(otp),
    expiresAt: otpExpiryDate(),
  });

  if (normalized.phone) {
    await sendOtpSms({ phone: normalized.phone, otp });
    return;
  }

  await sendOtpEmail(normalized.email!, otp);
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

function buildAuthResponse(user: IUser, tokens: TokenPair) {
  return { user, tokens };
}

export async function signupCustomer(input: CustomerSignupInput, req: Request): Promise<{ user: IUser; tokens: TokenPair }> {
  const normalized = normalizeIdentifier(input);

  const existing = await UserModel.findOne({
    $or: [{ ...(normalized.email ? { email: normalized.email } : {}) }, { ...(normalized.phone ? { phone: normalized.phone } : {}) }].filter(
      (candidate) => Object.keys(candidate).length > 0,
    ),
  });

  if (existing) {
    throw ApiError.conflict('An account with this mobile number or email already exists');
  }

  const user = await UserModel.create({
    name: input.name.trim(),
    phone: normalized.phone,
    email: normalized.email,
    passwordHash: await hashPassword(input.password),
    role: Role.CUSTOMER,
    isPhoneVerified: Boolean(normalized.phone),
    isEmailVerified: Boolean(normalized.email),
    lastLoginAt: new Date(),
  });

  const tokens = await issueTokenPair(user, req);
  return buildAuthResponse(user, tokens);
}

export async function loginCustomer(input: CustomerLoginInput, req: Request): Promise<{ user: IUser; tokens: TokenPair }> {
  const normalized = normalizeIdentifier(input);
  const user = normalized.phone ? await userRepository.findByPhone(normalized.phone) : await userRepository.findByEmail(normalized.email!);

  if (!user || !user.passwordHash || user.role !== Role.CUSTOMER) {
    throw ApiError.unauthorized('Invalid mobile number/email or password');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Contact support.');
  }

  const isValid = await comparePassword(input.password, user.passwordHash);
  if (!isValid) {
    throw ApiError.unauthorized('Invalid mobile number/email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueTokenPair(user, req);
  return buildAuthResponse(user, tokens);
}

export async function verifyOtpAndAuthenticate(
  input: VerifyOtpInput,
  req: Request,
): Promise<{ user: IUser; tokens: TokenPair; isNewUser: boolean }> {
  const normalized = normalizeIdentifier(input);
  await validateOtpRecord({ ...normalized, purpose: 'login', otp: input.otp });

  let user = normalized.phone ? await userRepository.findByPhone(normalized.phone) : await userRepository.findByEmail(normalized.email!);
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = await UserModel.create({
      name: input.name || 'Customer',
      phone: normalized.phone,
      email: normalized.email,
      role: Role.CUSTOMER,
      isPhoneVerified: Boolean(normalized.phone),
      isEmailVerified: Boolean(normalized.email),
    });
  } else {
    if (normalized.phone && !user.isPhoneVerified) user.isPhoneVerified = true;
    if (normalized.email && !user.isEmailVerified) user.isEmailVerified = true;
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueTokenPair(user, req);
  return { user, tokens, isNewUser };
}

export async function requestPasswordResetOtp(input: ForgotPasswordInput): Promise<void> {
  const normalized = normalizeIdentifier(input);
  const user = await findUserByIdentifier(normalized);

  if (!user || !user.isActive) {
    return;
  }

  await requestOtp({ ...normalized, purpose: 'password_reset' });
}

export async function resetPasswordWithOtp(input: ResetPasswordInput): Promise<void> {
  const normalized = normalizeIdentifier(input);
  await validateOtpRecord({ ...normalized, purpose: 'password_reset', otp: input.otp });

  const user = await findUserByIdentifier(normalized);
  if (!user || !user.isActive) {
    throw ApiError.badRequest('Account not found');
  }

  if (user.passwordHash && (await comparePassword(input.newPassword, user.passwordHash))) {
    throw ApiError.badRequest('New password must be different from your current password');
  }

  user.passwordHash = await hashPassword(input.newPassword);
  if (normalized.phone) user.isPhoneVerified = true;
  if (normalized.email) user.isEmailVerified = true;
  user.tokenVersion += 1;

  await Promise.all([
    user.save(),
    RefreshTokenModel.updateMany({ userId: user._id }, { $set: { revoked: true } }),
  ]);
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
    // Already invalid/expired; nothing to revoke.
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
