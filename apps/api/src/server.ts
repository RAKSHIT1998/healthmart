import path from 'path';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/db';
import { disconnectRedis } from './config/redis';
import { startAllCronJobs } from './jobs';
import { initSocketServer } from './realtime/socket';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  // Boot Next.js as the frontend server — skipped in test / when explicitly disabled.
  let nextHandle: ((req: any, res: any) => Promise<void>) | undefined;
  if (env.NODE_ENV !== 'test' && process.env.SERVE_NEXT !== 'false') {
    try {
      const next = (await import('next')).default;
      const dev = env.NODE_ENV !== 'production';
      const webDir = path.join(__dirname, '../../web');
      const nextApp = next({ dev, dir: webDir });
      await nextApp.prepare();
      nextHandle = nextApp.getRequestHandler();
      logger.info(`Next.js ${dev ? 'dev' : 'production'} server ready (dir: ${webDir})`);
    } catch (err) {
      logger.warn({ err }, 'Next.js not available — serving API only');
    }
  }

  const app = createApp(nextHandle);
  startAllCronJobs();

  const server = app.listen(env.PORT, () => {
    logger.info(`BuyMedicines.store API listening on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Swagger docs available at ${env.API_BASE_URL}/api/docs`);
  });

  initSocketServer(server);

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    server.close(async () => {
      await Promise.all([disconnectDatabase(), disconnectRedis()]);
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
