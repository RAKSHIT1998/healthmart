import type { Request } from 'express';
import { setupTestDB, teardownTestDB, clearDatabase } from './utils/db';
import { RefreshTokenModel, UserModel } from '../src/models';
import { generateTokenId, signRefreshToken } from '../src/utils/jwt';
import * as authService from '../src/services/auth.service';
import { ApiError } from '../src/utils/ApiError';
import { createCustomer } from './utils/fixtures';
import { hashPassword } from '../src/utils/hash';

const fakeRequest = { headers: {}, ip: '127.0.0.1' } as unknown as Request;

beforeAll(setupTestDB);
afterAll(teardownTestDB);
afterEach(clearDatabase);

describe('Customer signup and login', () => {
  it('creates a new customer account with password and issues tokens', async () => {
    const result = await authService.signupCustomer(
      {
        name: 'New Customer',
        phone: '9876543210',
        password: 'SecurePass123',
      },
      fakeRequest,
    );

    expect(result.user.phone).toBe('9876543210');
    expect(result.user.role).toBe('customer');
    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.tokens.refreshToken).toBeTruthy();

    const storedRefreshToken = await RefreshTokenModel.findOne({ userId: result.user._id });
    expect(storedRefreshToken).not.toBeNull();
  });

  it('rejects signup when the mobile number already exists', async () => {
    await createCustomer({ phone: '9876543211', email: 'dup@example.com' });

    await expect(
      authService.signupCustomer(
        {
          name: 'Duplicate Customer',
          phone: '9876543211',
          password: 'SecurePass123',
        },
        fakeRequest,
      ),
    ).rejects.toThrow(ApiError);
  });

  it('logs in an existing customer by phone', async () => {
    const customer = await createCustomer({
      phone: '9876543212',
      passwordHash: await hashPassword('SecurePass123'),
    });

    const result = await authService.loginCustomer(
      {
        phone: '9876543212',
        password: 'SecurePass123',
      },
      fakeRequest,
    );

    expect(String(result.user._id)).toBe(String(customer._id));
    expect(result.tokens.accessToken).toBeTruthy();
  });

  it('logs in an existing customer by email', async () => {
    const customer = await createCustomer({
      email: 'customer@example.com',
      passwordHash: await hashPassword('SecurePass123'),
    });

    const result = await authService.loginCustomer(
      {
        email: 'customer@example.com',
        password: 'SecurePass123',
      },
      fakeRequest,
    );

    expect(String(result.user._id)).toBe(String(customer._id));
    expect(result.tokens.refreshToken).toBeTruthy();
  });

  it('rejects an incorrect customer password', async () => {
    await createCustomer({
      phone: '9876543213',
      passwordHash: await hashPassword('SecurePass123'),
    });

    await expect(
      authService.loginCustomer(
        {
          phone: '9876543213',
          password: 'WrongPass123',
        },
        fakeRequest,
      ),
    ).rejects.toThrow(ApiError);
  });
});

describe('Refresh token rotation', () => {
  it('rotates the refresh token and revokes the previous one', async () => {
    const user = await UserModel.create({
      name: 'Refresh Customer',
      phone: '9876543220',
      passwordHash: await hashPassword('SecurePass123'),
      role: 'customer',
      isPhoneVerified: true,
      isActive: true,
    });

    const { tokens } = await authService.loginCustomer({ phone: '9876543220', password: 'SecurePass123' }, fakeRequest);

    const rotated = await authService.refreshAccessToken(tokens.refreshToken, fakeRequest);
    expect(rotated.accessToken).toBeTruthy();
    expect(rotated.refreshToken).not.toBe(tokens.refreshToken);

    await expect(authService.refreshAccessToken(tokens.refreshToken, fakeRequest)).rejects.toThrow(ApiError);
    await expect(authService.refreshAccessToken(rotated.refreshToken, fakeRequest)).rejects.toThrow(ApiError);
    expect(String(user._id)).toBeTruthy();
  });

  it('rejects a refresh token with a forged jti not present in the database', async () => {
    const bogusToken = signRefreshToken({ sub: '64b000000000000000000000', jti: generateTokenId(), tokenVersion: 0 });
    await expect(authService.refreshAccessToken(bogusToken, fakeRequest)).rejects.toThrow(ApiError);
  });
});
