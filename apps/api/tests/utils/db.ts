import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;
let usingExternalServer = false;

/**
 * Connects to a throwaway MongoDB for the test run. If TEST_MONGO_URI is set
 * (e.g. a CI-provided Mongo service container), it connects to a uniquely-named
 * database on that server instead of downloading an in-memory binary — useful
 * in sandboxes/CI runners where outbound binary downloads are blocked or
 * unreliable. Defaults to mongodb-memory-server, which needs no external
 * MongoDB and is the right choice for normal local development.
 */
export async function setupTestDB(): Promise<void> {
  const externalUri = process.env.TEST_MONGO_URI;

  if (externalUri) {
    usingExternalServer = true;
    const dbName = `healthmart_test_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const uri = externalUri.replace(/\/?$/, `/${dbName}`);
    await mongoose.connect(uri);
    return;
  }

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
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
