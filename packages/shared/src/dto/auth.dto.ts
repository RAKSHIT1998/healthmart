import { z } from 'zod';
import { REGEX } from '../constants';

export const sendOtpSchema = z
  .object({
    phone: z.string().regex(REGEX.PHONE, 'Enter a valid 10-digit Indian mobile number').optional(),
    email: z.string().regex(REGEX.EMAIL, 'Enter a valid email').optional(),
    purpose: z.enum(['login', 'signup', 'checkout']).default('login'),
  })
  .refine((data) => Boolean(data.phone) !== Boolean(data.email), {
    message: 'Provide either a phone number or an email, not both',
  });

export const verifyOtpSchema = z
  .object({
    phone: z.string().regex(REGEX.PHONE).optional(),
    email: z.string().regex(REGEX.EMAIL).optional(),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    name: z.string().min(2).max(80).optional(),
  })
  .refine((data) => Boolean(data.phone) !== Boolean(data.email), {
    message: 'Provide either a phone number or an email',
  });

export const staffLoginSchema = z.object({
  email: z.string().regex(REGEX.EMAIL, 'Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10).optional(),
});

export const customerSignupSchema = z
  .object({
    name: z.string().min(2).max(80),
    phone: z.string().regex(REGEX.PHONE, 'Enter a valid 10-digit Indian mobile number').optional(),
    email: z.string().regex(REGEX.EMAIL, 'Enter a valid email').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((data) => Boolean(data.phone) || Boolean(data.email), {
    message: 'Provide at least a mobile number or an email address',
    path: ['phone'],
  });

export const customerLoginSchema = z
  .object({
    phone: z.string().regex(REGEX.PHONE, 'Enter a valid 10-digit Indian mobile number').optional(),
    email: z.string().regex(REGEX.EMAIL, 'Enter a valid email').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((data) => Boolean(data.phone) !== Boolean(data.email), {
    message: 'Provide either a mobile number or an email address',
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
export type CustomerSignupInput = z.infer<typeof customerSignupSchema>;
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
export type CreateStaffUserInput = z.infer<typeof createStaffUserSchema>;
