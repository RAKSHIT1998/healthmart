import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import pinoHttp from 'pino-http';
import { env, envMisconfigured, isProduction } from './config/env';
import { logger } from './config/logger';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware';
import { mountSwaggerDocs } from './docs/swagger';
import apiRoutes from './routes';

type NextHandle = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

// Mutable ref filled in by server.ts once nextApp.prepare() completes.
export type NextHandleRef = { fn: NextHandle | null };

export function createApp(nextHandleRef?: NextHandleRef): Express {
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
  // `verify` stashes raw bytes so webhook routes (Cashfree, MARG) can validate
  // HMAC signatures — body-parser only reads the stream once.
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

  // /health always responds immediately — even before MongoDB/Next.js are ready.
  // This is what Railway polls during deployment; it must never be gated on slow init.
  app.get('/health', (_req, res) => {
    if (envMisconfigured) {
      return res.status(200).json({
        status: 'misconfigured',
        timestamp: new Date().toISOString(),
        errors: envMisconfigured,
      });
    }
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: env.NODE_ENV });
  });

  mountSwaggerDocs(app);
  app.use('/api/v1', apiRoutes);
  app.use('/api/v1', notFoundHandler);

  // Catch-all: forward to Next.js once ready; 503 while initialising.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const handle = nextHandleRef?.fn;
    if (handle) {
      handle(req as unknown as IncomingMessage, res as unknown as ServerResponse).catch(next);
    } else {
      res.status(503).json({ status: 'starting', message: 'Server is still initialising, retry in a moment.' });
    }
  });

  app.use(errorHandler);

  return app;
}
