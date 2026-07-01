import express, { type Express, type Request, type Response, type NextFunction } from 'express';
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

// Mutable ref filled by server.ts once nextApp.prepare() completes.
export type NextHandleRef = { fn: NextHandle | null };

export function createApp(nextHandleRef?: NextHandleRef): Express {
  const app = express();

  app.set('trust proxy', 1);
  // Disable helmet's default CSP — it sets `script-src 'self'` which blocks
  // Next.js's inline <script> tags (__NEXT_DATA__, RSC payload, hydration bootstrap).
  // The storefront goes blank because React can't hydrate without those scripts.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
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
  app.use(pinoHttp({ logger, autoLogging: !isProduction }));
  app.use(globalRateLimiter);

  // /health always responds immediately — never gated on slow async init.
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: env.NODE_ENV });
  });

  mountSwaggerDocs(app);
  app.use('/api/v1', apiRoutes);
  app.use('/api/v1', notFoundHandler);

  // Catch-all: forward to Next.js once ready; 503 while still initialising.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const handle = nextHandleRef?.fn;
    if (handle) {
      handle(req as unknown as IncomingMessage, res as unknown as ServerResponse).catch(next);
    } else {
      res.status(503).json({ status: 'starting', message: 'Server is initialising, retry in a moment.' });
    }
  });

  app.use(errorHandler);

  return app;
}
