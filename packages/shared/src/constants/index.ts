export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const GST_SLABS = [0, 5, 12, 18, 28] as const;

export const REGEX = {
  /** Indian mobile numbers, optionally with +91 prefix. */
  PHONE: /^(?:\+91)?[6-9]\d{9}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** GSTIN format. */
  GSTIN: /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z]\d$/,
  /** Indian HSN code (4-8 digits). */
  HSN: /^\d{4,8}$/,
  PINCODE: /^\d{6}$/,
};

export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 5,
  RESEND_COOLDOWN_SECONDS: 30,
} as const;

export const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY_DAYS: 30,
} as const;

export const CHECKOUT_CONFIG = {
  /** Minutes a stock reservation is held while the customer completes payment. */
  RESERVATION_HOLD_MINUTES: 15,
  FREE_DELIVERY_THRESHOLD: 499,
  STANDARD_DELIVERY_FEE: 29,
  EXPRESS_DELIVERY_FEE: 49,
} as const;

export const LOW_STOCK_THRESHOLD_UNITS = 10;
export const EXPIRY_ALERT_WINDOW_DAYS = 90;
/** Days after delivery a customer can request a return. */
export const RETURN_WINDOW_DAYS = 7;

export const REFERRAL_CONFIG = {
  /** Wallet credit (₹) for the existing customer whose code was used. */
  REFERRER_REWARD: 100,
  /** Wallet credit (₹) for the new customer who applied a referral code. */
  REFEREE_REWARD: 50,
} as const;

export const APP_NAME = 'Medicare Medical Store';
export const APP_TAGLINE = 'Your trusted pharmacy delivered within minutes.';
