import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import '../../src/models'; // ensures every model (and its indexes) is registered before syncIndexes runs below

let mongoServer: MongoMemoryServer | null = null;
let usingExternalServer = false;

async function ensureIndexes(): Promise<void> {
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).syncIndexes()));
}

/**
 * Connects to a throwaway MongoDB for the test run. If TEST_MONGO_URI is set
 * (e.g. a CI-provided Mongo service container), it connects to a uniquely-named
 * database on that server instead of downloading an in-memory binary — useful
 * in sandboxes/CI runners where outbound binary downloads are blocked or
 * unreliable. Defaults to mongodb-memory-server, which needs no external
 * MongoDB and is the right choice for normal local development.
 *
 * Explicitly syncs indexes before returning — without this, unique-index
 * guarantees (e.g. the appointment double-booking guard) can silently not be
 * enforced yet when the very first test writes happen, since index builds
 * normally happen asynchronously in the background.
 */
export async function setupTestDB(): Promise<void> {
  const externalUri = process.env.TEST_MONGO_URI;

  if (externalUri) {
    usingExternalServer = true;
    const dbName = `buymedicines_test_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const uri = externalUri.replace(/\/?$/, `/${dbName}`);
    await mongoose.connect(uri);
  } else {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }

  await ensureIndexes();
}

export async function teardownTestDB(): Promise<void> {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (!usingExternalServer && mongoServer) await mongoServer.stop();
}

export async function clearDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key]!.deleteMany({});
  }
}
