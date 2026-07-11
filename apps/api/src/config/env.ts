import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_BASE_URL: z.string().url().default('http://localhost:5000'),
  SITE_URL: z.string().url().default('https://buymedicine.store'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Required — validated at runtime in server.ts (not here), so missing values
  // never crash the process before app.listen() fires.
  MONGO_URI: z.string().default(''),
  JWT_ACCESS_SECRET: z.string().default(''),
  JWT_REFRESH_SECRET: z.string().default(''),

  // Redis (optional)
  REDIS_URL: z.string().optional(),

  // Cloudinary (optional)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // MSG91 (optional)
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_SENDER_ID: z.string().optional(),
  MSG91_OTP_TEMPLATE_ID: z.string().optional(),
  MSG91_WHATSAPP_TEMPLATE_ID: z.string().optional(),
  MSG91_WHATSAPP_INVOICE_TEMPLATE_ID: z.string().optional(),
  MSG91_WHATSAPP_DRIVER_ASSIGN_TEMPLATE_ID: z.string().optional(),
  MSG91_WHATSAPP_SALES_ALERT_TEMPLATE_ID: z.string().optional(),
  SALES_TEAM_WHATSAPP_NUMBERS: z.string().optional(),

  // Resend (optional)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().default('BuyMedicines.store <orders@buymedicine.store>'),

  // Cashfree (optional)
  CASHFREE_APP_ID: z.string().optional(),
  CASHFREE_SECRET_KEY: z.string().optional(),
  CASHFREE_ENV: z.enum(['SANDBOX', 'PRODUCTION']).default('SANDBOX'),
  CASHFREE_WEBHOOK_SECRET: z.string().optional(),

  // Firebase (optional)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  // Google Maps (optional)
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // Agora (optional)
  AGORA_APP_ID: z.string().optional(),
  AGORA_APP_CERTIFICATE: z.string().optional(),

  // MARG ERP (optional)
  MARG_INTEGRATION_MODE: z.enum(['csv', 'webhook', 'api', 'disabled']).catch('disabled'),
  MARG_SYNC_CRON: z.string().default('*/30 * * * *'),
  MARG_CSV_WATCH_DIR: z.string().default('./marg-sync/incoming'),
  MARG_CSV_PROCESSED_DIR: z.string().default('./marg-sync/processed'),
  MARG_WEBHOOK_SECRET: z.string().default('change-me-marg-webhook-secret'),
  MARG_API_BASE_URL: z.string().optional(),
  MARG_API_KEY: z.string().optional(),
  MARG_BRANCH_CODE: z.string().optional(),

  // Seed
  ADMIN_SEED_EMAIL: z.string().default('admin@buymedicine.store'),
  ADMIN_SEED_PASSWORD: z.string().default('ChangeMe@12345'),
});

// Parse with safe defaults — this schema has no required fields without defaults,
// so parse({}) always succeeds. The MONGO_URI / JWT secret emptiness is caught
// later in server.ts, after app.listen() is already running.
export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
