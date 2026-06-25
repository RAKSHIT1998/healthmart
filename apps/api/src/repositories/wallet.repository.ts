import { BaseRepository } from './BaseRepository';
import { WalletModel, WalletTransactionModel, type IWallet, type IWalletTransaction } from '../models';

class WalletRepository extends BaseRepository<IWallet> {
  constructor() {
    super(WalletModel);
  }

  async findOrCreateForUser(userId: string) {
    return this.model.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, balance: 0 } },
      { upsert: true, new: true },
    );
  }

  async credit(userId: string, amount: number) {
    return this.model.findOneAndUpdate(
      { userId },
      { $inc: { balance: amount }, $setOnInsert: { userId } },
      { upsert: true, new: true },
    );
  }

  /** Atomically guarded debit — fails (returns null) if balance would go negative. */
  async debit(userId: string, amount: number) {
    return this.model.findOneAndUpdate(
      { userId, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { new: true },
    );
  }
}

class WalletTransactionRepository extends BaseRepository<IWalletTransaction> {
  constructor() {
    super(WalletTransactionModel);
  }

  async listForUser(userId: string, page: number, limit: number) {
    return this.paginate({ userId }, { page, limit });
  }
}

export const walletRepository = new WalletRepository();
export const walletTransactionRepository = new WalletTransactionRepository();
