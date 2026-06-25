import { z } from 'zod';
import { REGEX } from '../constants';

export const sendOtpSchema = z.object({
  phone: z.string().regex(REGEX.PHONE, 'Enter a valid 10-digit Indian mobile number'),
  purpose: z.enum(['login', 'signup', 'checkout']).default('login'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(REGEX.PHONE),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  name: z.string().min(2).max(80).optional(),
  email: z.string().regex(REGEX.EMAIL).optional(),
});

export const staffLoginSchema = z.object({
  email: z.string().regex(REGEX.EMAIL, 'Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10).optional(),
});

export const createStaffUserSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().regex(REGEX.EMAIL),
  phone: z.string().regex(REGEX.PHONE),
  password: z.string().min(8),
  role: z.enum(['admin', 'manager', 'pharmacist', 'inventory_manager', 'delivery_boy']),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type StaffLoginInput = z.infer<typeof staffLoginSchema>;
export type CreateStaffUserInput = z.infer<typeof createStaffUserSchema>;
