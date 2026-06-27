import { connectDatabase, disconnectDatabase } from '../config/db';
import { logger } from '../config/logger';
import { runFullSync } from '../services/margSync.service';

async function main(): Promise<void> {
  await connectDatabase();
  const logs = await runFullSync();
  for (const log of logs) {
    logger.info(`${log.entity}: ${log.status} (processed=${log.recordsProcessed}, failed=${log.recordsFailed})`);
  }
  await disconnectDatabase();
}

main().catch((err) => {
  logger.error({ err }, 'Manual MARG sync run failed');
  process.exit(1);
});
