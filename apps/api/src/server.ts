import path from 'path';
import { createApp, type NextHandleRef } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/db';
import { disconnectRedis } from './config/redis';
import { startAllCronJobs } from './jobs';
import { initSocketServer } from './realtime/socket';

async function bootstrap(): Promise<void> {
  // ── 1. Bind to port immediately ────────────────────────────────────────────
  const nextHandleRef: NextHandleRef = { fn: null };
  const app = createApp(nextHandleRef);

  const server = app.listen(env.PORT, () => {
    logger.info(`BuyMedicines.store API listening on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Swagger docs: ${env.API_BASE_URL}/api/docs`);
  });

  initSocketServer(server);

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down…`);
    server.close(async () => {
      await Promise.all([disconnectDatabase(), disconnectRedis()]);
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => logger.error({ reason }, 'Unhandled rejection'));
  process.on('uncaughtException', (err) => logger.error({ err }, 'Uncaught exception — process survived'));

  // ── 2. Check required env vars ─────────────────────────────────────────────
  const missing: string[] = [];
  if (!env.MONGO_URI)          missing.push('MONGO_URI');
  if (!env.JWT_ACCESS_SECRET)  missing.push('JWT_ACCESS_SECRET');
  if (!env.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');
  if (missing.length) {
    logger.error({ missing }, 'Required env vars not set — set them in Railway → Variables');
  }

  // ── 3. Start Next.js and MongoDB in parallel ───────────────────────────────
  // Next.js MUST start regardless of DB status so the storefront is always served.
  const [dbResult, nextResult] = await Promise.allSettled([
    // MongoDB
    (async () => {
      if (!env.MONGO_URI) throw new Error('MONGO_URI not set');
      await connectDatabase();
      startAllCronJobs();
    })(),

    // Next.js
    (async () => {
      if (env.NODE_ENV === 'test' || process.env.SERVE_NEXT === 'false') return;
      const next = (await import('next')).default;
      const dev  = env.NODE_ENV !== 'production';
      const webDir = path.join(__dirname, '../../web');
      const nextApp = next({ dev, dir: webDir });
      await nextApp.prepare();
      nextHandleRef.fn = nextApp.getRequestHandler();
      logger.info(`Next.js ${dev ? 'dev' : 'production'} server ready`);
    })(),
  ]);

  if (dbResult.status === 'rejected') {
    logger.error({ err: dbResult.reason }, 'Database init failed — API routes will error');
  }
  if (nextResult.status === 'rejected') {
    logger.warn({ err: nextResult.reason }, 'Next.js init failed — serving API only');
  }
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
