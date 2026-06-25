import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_BASE_URL: z.string().url().default('http://localhost:5000'),
  WEB_BASE_URL: z.string().url().default('http://localhost:3000'),
  DASHBOARD_BASE_URL: z.string().url().default('http://localhost:3001'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),

  // Database
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  // Redis (optional in Phase 1 — caching layer lands in Phase 2)
  REDIS_URL: z.string().optional(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // MSG91 (SMS / OTP)
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_SENDER_ID: z.string().optional(),
  MSG91_OTP_TEMPLATE_ID: z.string().optional(),
  MSG91_WHATSAPP_TEMPLATE_ID: z.string().optional(),

  // Resend (Email)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().default('Medicare Medical Store <orders@medicaremedicalstore.com>'),

  // Cashfree
  CASHFREE_APP_ID: z.string().optional(),
  CASHFREE_SECRET_KEY: z.string().optional(),
  CASHFREE_ENV: z.enum(['SANDBOX', 'PRODUCTION']).default('SANDBOX'),
  CASHFREE_WEBHOOK_SECRET: z.string().optional(),

  // Firebase (Push Notifications)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  // Google Maps
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // MARG ERP Integration
  MARG_INTEGRATION_MODE: z.enum(['csv', 'webhook', 'api', 'disabled']).default('csv'),
  MARG_SYNC_CRON: z.string().default('*/30 * * * *'),
  MARG_CSV_WATCH_DIR: z.string().default('./marg-sync/incoming'),
  MARG_CSV_PROCESSED_DIR: z.string().default('./marg-sync/processed'),
  MARG_WEBHOOK_SECRET: z.string().default('change-me-marg-webhook-secret'),
  MARG_API_BASE_URL: z.string().optional(),
  MARG_API_KEY: z.string().optional(),
  MARG_BRANCH_CODE: z.string().optional(),

  // Misc
  ADMIN_SEED_EMAIL: z.string().email().default('admin@medicaremedicalstore.com'),
  ADMIN_SEED_PASSWORD: z.string().default('ChangeMe@12345'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration. Check your .env file against .env.example.');
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
