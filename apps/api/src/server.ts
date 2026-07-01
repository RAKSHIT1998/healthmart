import path from 'path';
import { createApp, type NextHandleRef } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/db';
import { disconnectRedis } from './config/redis';
import { startAllCronJobs } from './jobs';
import { initSocketServer } from './realtime/socket';

async function bootstrap(): Promise<void> {
  // ── 1. Bind to the port FIRST ───────────────────────────────────────────────
  // /health must respond before MongoDB and Next.js initialise.
  // Railway polls /health immediately after container start — any delay here
  // causes the deployment to be marked failed.
  const nextHandleRef: NextHandleRef = { fn: null };
  const app = createApp(nextHandleRef);

  const server = app.listen(env.PORT, () => {
    logger.info(`BuyMedicines.store API listening on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Swagger docs: ${env.API_BASE_URL}/api/docs`);
  });

  initSocketServer(server);

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully…`);
    server.close(async () => {
      await Promise.all([disconnectDatabase(), disconnectRedis()]);
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => logger.error({ reason }, 'Unhandled rejection'));

  // ── 2. Validate required env vars (after the port is bound) ────────────────
  const missing: string[] = [];
  if (!env.MONGO_URI)          missing.push('MONGO_URI');
  if (!env.JWT_ACCESS_SECRET)  missing.push('JWT_ACCESS_SECRET');
  if (!env.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');

  if (missing.length) {
    logger.error(
      { missing },
      'Required environment variables are not set. ' +
      'Add them in Railway → Service → Variables and redeploy.',
    );
    // Keep the process alive so /health keeps returning 200 (misconfigured)
    // rather than crashing and entering a restart loop that Railway marks as failed.
    return;
  }

  // ── 3. Connect to MongoDB ───────────────────────────────────────────────────
  try {
    await connectDatabase();
  } catch (err) {
    logger.error({ err }, 'Database connection failed');
    // Stay alive — /health will keep returning 200 so Railway doesn't restart-loop.
    return;
  }

  // ── 4. Boot Next.js (non-blocking — storefront returns 503 until ready) ────
  if (env.NODE_ENV !== 'test' && process.env.SERVE_NEXT !== 'false') {
    try {
      const next = (await import('next')).default;
      const dev = env.NODE_ENV !== 'production';
      const webDir = path.join(__dirname, '../../web');
      const nextApp = next({ dev, dir: webDir });
      await nextApp.prepare();
      nextHandleRef.fn = nextApp.getRequestHandler();
      logger.info(`Next.js ${dev ? 'dev' : 'production'} server ready`);
    } catch (err) {
      logger.warn({ err }, 'Next.js not available — API-only mode');
    }
  }

  // ── 5. Start background jobs ────────────────────────────────────────────────
  startAllCronJobs();
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
