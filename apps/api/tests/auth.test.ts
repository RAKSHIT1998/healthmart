import type { Request } from 'express';
import { setupTestDB, teardownTestDB, clearDatabase } from './utils/db';
import { OtpModel, RefreshTokenModel } from '../src/models';
import { hashToken, generateTokenId, signRefreshToken } from '../src/utils/jwt';
import { generateOtp, otpExpiryDate } from '../src/utils/otp';
import * as authService from '../src/services/auth.service';
import { ApiError } from '../src/utils/ApiError';

const fakeRequest = { headers: {}, ip: '127.0.0.1' } as unknown as Request;

beforeAll(setupTestDB);
afterAll(teardownTestDB);
afterEach(clearDatabase);

describe('OTP request', () => {
  it('creates a pending OTP record for the phone number', async () => {
    await authService.requestOtp({ phone: '9876543210', purpose: 'login' });
    const otp = await OtpModel.findOne({ phone: '9876543210' });
    expect(otp).not.toBeNull();
    expect(otp!.verified).toBe(false);
  });

  it('throttles repeated OTP requests within the cooldown window', async () => {
    await authService.requestOtp({ phone: '9876543211', purpose: 'login' });
    await expect(authService.requestOtp({ phone: '9876543211', purpose: 'login' })).rejects.toThrow(ApiError);
  });
});

describe('OTP verification and session issuance', () => {
  async function seedOtp(phone: string, otp: string) {
    await OtpModel.create({ phone, otpHash: hashToken(otp), purpose: 'login', expiresAt: otpExpiryDate() });
  }

  it('creates a new customer account and issues a token pair on first verification', async () => {
    const phone = '9123456780';
    const otp = generateOtp();
    await seedOtp(phone, otp);

    const result = await authService.verifyOtpAndAuthenticate({ phone, otp, name: 'New Customer' }, fakeRequest);

    expect(result.isNewUser).toBe(true);
    expect(result.user.phone).toBe(phone);
    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.tokens.refreshToken).toBeTruthy();

    const storedRefreshToken = await RefreshTokenModel.findOne({ userId: result.user._id });
    expect(storedRefreshToken).not.toBeNull();
  });

  it('rejects an incorrect OTP and increments the attempt counter', async () => {
    const phone = '9123456781';
    await seedOtp(phone, '111111');

    await expect(authService.verifyOtpAndAuthenticate({ phone, otp: '000000' }, fakeRequest)).rejects.toThrow(ApiError);

    const otpRecord = await OtpModel.findOne({ phone });
    expect(otpRecord!.attempts).toBe(1);
  });
});

describe('Refresh token rotation', () => {
  it('rotates the refresh token and revokes the previous one', async () => {
    const phone = '9123456782';
    const otp = generateOtp();
    await OtpModel.create({ phone, otpHash: hashToken(otp), purpose: 'login', expiresAt: otpExpiryDate() });
    const { tokens } = await authService.verifyOtpAndAuthenticate({ phone, otp }, fakeRequest);

    const rotated = await authService.refreshAccessToken(tokens.refreshToken, fakeRequest);
    expect(rotated.accessToken).toBeTruthy();
    expect(rotated.refreshToken).not.toBe(tokens.refreshToken);

    // Reusing the original (now-rotated-away) refresh token must fail and revoke the whole family.
    await expect(authService.refreshAccessToken(tokens.refreshToken, fakeRequest)).rejects.toThrow(ApiError);

    // The freshly rotated token should now also be revoked as a consequence of the reuse-detection sweep.
    await expect(authService.refreshAccessToken(rotated.refreshToken, fakeRequest)).rejects.toThrow(ApiError);
  });

  it('rejects a refresh token with a forged jti not present in the database', async () => {
    const bogusToken = signRefreshToken({ sub: '64b000000000000000000000', jti: generateTokenId(), tokenVersion: 0 });
    await expect(authService.refreshAccessToken(bogusToken, fakeRequest)).rejects.toThrow(ApiError);
  });
});
