import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db';
import { logger } from '../config/logger';
import '../models';

/**
 * Restores a backup produced by `backup.ts`. Upserts by `_id` (merge, not
 * wipe-then-insert) so a partial or stale backup can never silently delete
 * documents created after the backup was taken. Requires an explicit
 * `--confirm` flag since this writes directly into the database.
 *
 * Usage: `npm run restore -- ./backups/2026-01-15T10-00-00-000Z --confirm`
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const backupDir = args.find((a) => !a.startsWith('--'));
  const confirmed = args.includes('--confirm');

  if (!backupDir) {
    logger.error('Usage: npm run restore -- <backup-directory> --confirm');
    process.exit(1);
  }

  const resolvedDir = path.resolve(backupDir);
  if (!fs.existsSync(resolvedDir)) {
    logger.error(`Backup directory not found: ${resolvedDir}`);
    process.exit(1);
  }

  if (!confirmed) {
    logger.warn(
      `Dry run only (pass --confirm to actually write). This would restore from: ${resolvedDir}`,
    );
  }

  await connectDatabase();

  const files = fs.readdirSync(resolvedDir).filter((f) => f.endsWith('.json'));
  let totalDocs = 0;

  for (const file of files) {
    const modelName = path.basename(file, '.json');
    let model;
    try {
      model = mongoose.model(modelName);
    } catch {
      logger.warn(`Skipping ${file}: no registered model named "${modelName}"`);
      continue;
    }

    const docs = JSON.parse(fs.readFileSync(path.join(resolvedDir, file), 'utf-8')) as Array<{ _id: string }>;
    if (docs.length === 0) continue;

    if (confirmed) {
      const operations = docs.map((doc) => ({
        updateOne: { filter: { _id: doc._id }, update: { $set: doc }, upsert: true },
      }));
      await model.bulkWrite(operations);
    }

    totalDocs += docs.length;
    logger.info(`${confirmed ? 'Restored' : 'Would restore'} ${docs.length} document(s) into ${modelName}`);
  }

  logger.info(`${confirmed ? 'Restore complete' : 'Dry run complete'}: ${totalDocs} document(s) across ${files.length} collection(s)`);
  await disconnectDatabase();
}

main().catch((err) => {
  logger.error({ err }, 'Restore failed');
  process.exit(1);
});
