import { WalletTransactionType, type WalletTransactionReason } from '@healthmart/shared';
import { walletRepository, walletTransactionRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';

export async function getWallet(userId: string) {
  return walletRepository.findOrCreateForUser(userId);
}

export async function listTransactions(userId: string, page: number, limit: number) {
  return walletTransactionRepository.listForUser(userId, page, limit);
}

export async function creditWallet(
  userId: string,
  amount: number,
  reason: WalletTransactionReason,
  referenceId?: string,
  remarks?: string,
) {
  const wallet = await walletRepository.credit(userId, amount);
  await walletTransactionRepository.create({
    walletId: wallet._id,
    userId,
    type: WalletTransactionType.CREDIT,
    amount,
    reason,
    balanceAfter: wallet.balance,
    referenceId,
    remarks,
  } as never);
  return wallet;
}

export async function debitWallet(
  userId: string,
  amount: number,
  reason: WalletTransactionReason,
  referenceId?: string,
  remarks?: string,
) {
  await walletRepository.findOrCreateForUser(userId);
  const wallet = await walletRepository.debit(userId, amount);
  if (!wallet) {
    throw ApiError.badRequest('Insufficient wallet balance');
  }
  await walletTransactionRepository.create({
    walletId: wallet._id,
    userId,
    type: WalletTransactionType.DEBIT,
    amount,
    reason,
    balanceAfter: wallet.balance,
    referenceId,
    remarks,
  } as never);
  return wallet;
}
