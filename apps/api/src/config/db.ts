import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

mongoose.set('strictQuery', true);

// Debounce repetitive connection-error logs — Mongoose retries aggressively
// and each attempt would otherwise flood Railway's 500 log/sec limit.
let _lastErrorLog = 0;
function logDbError(err: unknown) {
  const now = Date.now();
  if (now - _lastErrorLog > 10_000) {
    _lastErrorLog = now;
    logger.error({ err }, 'MongoDB connection error');
  }
}

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('error', logDbError);
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  await mongoose.connect(env.MONGO_URI, {
    autoIndex: !env.NODE_ENV.startsWith('prod'),
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
  });

  await ensureIndexes();
}

async function ensureIndexes(): Promise<void> {
  const modelNames = mongoose.modelNames();
  await Promise.all(modelNames.map((name) => mongoose.model(name).syncIndexes()));
  logger.info(`Synced indexes for ${modelNames.length} model(s)`);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
