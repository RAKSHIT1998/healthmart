import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db';
import { logger } from '../config/logger';
import '../models'; // ensures every model is registered before we enumerate them

/**
 * Dumps every collection to timestamped JSON files under `backups/<timestamp>/`.
 * Run with: `npm run backup` (from apps/api). This is a CLI-only tool —
 * deliberately not exposed over HTTP, since a backup/restore endpoint would be
 * a serious attack surface (arbitrary data export/overwrite) for very little
 * legitimate benefit over an operator running this script directly.
 */
async function main(): Promise<void> {
  await connectDatabase();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.resolve(__dirname, '../../backups', timestamp);
  fs.mkdirSync(outDir, { recursive: true });

  const modelNames = mongoose.modelNames();
  let totalDocs = 0;

  for (const name of modelNames) {
    const model = mongoose.model(name);
    const docs = await model.find({}).lean();
    fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(docs, null, 2));
    totalDocs += docs.length;
    logger.info(`Backed up ${docs.length} document(s) from ${name}`);
  }

  logger.info(`Backup complete: ${modelNames.length} collections, ${totalDocs} documents -> ${outDir}`);
  await disconnectDatabase();
}

main().catch((err) => {
  logger.error({ err }, 'Backup failed');
  process.exit(1);
});
