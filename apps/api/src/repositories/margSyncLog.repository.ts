import { BaseRepository } from './BaseRepository';
import { MargSyncLogModel, type IMargSyncLog } from '../models';

class MargSyncLogRepository extends BaseRepository<IMargSyncLog> {
  constructor() {
    super(MargSyncLogModel);
  }

  async listRecent(page: number, limit: number) {
    return this.paginate({}, { page, limit, sort: { createdAt: -1 } });
  }
}

export const margSyncLogRepository = new MargSyncLogRepository();
