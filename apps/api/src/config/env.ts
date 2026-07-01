import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_BASE_URL: z.string().url().default('http://localhost:5000'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Database
  MONGO_URI: z.string().min(1).default(''),

  // Redis (optional)
  REDIS_URL: z.string().optional(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(1).default(''),
  JWT_REFRESH_SECRET: z.string().min(1).default(''),

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
  RESEND_FROM_EMAIL: z.string().default('BuyMedicines.store <orders@buymedicine.store>'),

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

  // Agora (Doctor video/audio consultation)
  AGORA_APP_ID: z.string().optional(),
  AGORA_APP_CERTIFICATE: z.string().optional(),

  // MARG ERP Integration
  MARG_INTEGRATION_MODE: z.enum(['csv', 'webhook', 'api', 'disabled']).default('disabled'),
  MARG_SYNC_CRON: z.string().default('*/30 * * * *'),
  MARG_CSV_WATCH_DIR: z.string().default('./marg-sync/incoming'),
  MARG_CSV_PROCESSED_DIR: z.string().default('./marg-sync/processed'),
  MARG_WEBHOOK_SECRET: z.string().default('change-me-marg-webhook-secret'),
  MARG_API_BASE_URL: z.string().optional(),
  MARG_API_KEY: z.string().optional(),
  MARG_BRANCH_CODE: z.string().optional(),

  // Misc
  ADMIN_SEED_EMAIL: z.string().email().default('admin@buymedicine.store'),
  ADMIN_SEED_PASSWORD: z.string().default('ChangeMe@12345'),
});

// Never throw at module-load time — doing so prevents app.listen() from ever
// running, which means Railway's health check sees connection-refused on every
// attempt and marks the deployment as failed before any logs are visible.
// Required fields (MONGO_URI, JWT secrets) are validated in server.ts AFTER the
// HTTP server is already listening, so /health always responds immediately.
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('[env] Configuration warnings (non-fatal at load time):', parsed.error.flatten().fieldErrors);
}

export const env = parsed.success ? parsed.data : (envSchema.parse({}));
export const envMisconfigured = !parsed.success ? parsed.error.flatten().fieldErrors : null;

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
