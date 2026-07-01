import express, { type Express } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import pinoHttp from 'pino-http';
import { env, isProduction } from './config/env';
import { logger } from './config/logger';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware';
import { mountSwaggerDocs } from './docs/swagger';
import apiRoutes from './routes';

type NextHandle = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

export function createApp(nextHandle?: NextHandle): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  // `verify` stashes the raw bytes on every request so webhook routes (Cashfree, MARG)
  // can validate their HMAC signatures against the exact payload — re-parsing the
  // body a second time in those routes would silently no-op since body-parser only
  // reads the stream once.
  app.use(
    express.json({
      limit: '2mb',
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(mongoSanitize());
  app.use(hpp());
  app.use(pinoHttp({ logger, autoLogging: !isProduction ? { ignore: () => true } : true }));
  app.use(globalRateLimiter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: env.NODE_ENV });
  });

  mountSwaggerDocs(app);
  app.use('/api/v1', apiRoutes);
  app.use('/api/v1', notFoundHandler);

  if (nextHandle) {
    app.all('*', (req, res) => nextHandle(req, res));
  } else {
    app.use(notFoundHandler);
  }
  app.use(errorHandler);

  return app;
}
