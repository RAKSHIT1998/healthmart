import rateLimit from 'express-rate-limit';

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later', code: 'TOO_MANY_REQUESTS' },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later', code: 'TOO_MANY_REQUESTS' },
});

export const otpRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Please wait before requesting another OTP', code: 'TOO_MANY_REQUESTS' },
});

export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
