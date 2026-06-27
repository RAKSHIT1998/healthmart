import crypto from 'crypto';
import {
  NotificationChannel,
  NotificationType,
  OrderStatus,
  REFERRAL_CONFIG,
  WalletTransactionReason,
  type CreateFlashSaleInput,
  type IssueGiftCardInput,
  type UpdateFlashSaleInput,
} from '@healthmart/shared';
import { UserModel, OrderModel } from '../models';
import { flashSaleRepository, giftCardRepository, referralRewardRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import { creditWallet } from './wallet.service';
import { notifyUser } from './notification.service';

// ---------------------------------------------------------------------------
// Referral program
// ---------------------------------------------------------------------------

function randomCodeSuffix(length: number): string {
  return crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
}

export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const user = await UserModel.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  if (user.referralCode) return user.referralCode;

  const namePrefix = (user.name || 'USER').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase().padEnd(4, 'X');

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${namePrefix}${randomCodeSuffix(4)}`;
    const exists = await UserModel.exists({ referralCode: candidate });
    if (!exists) {
      user.referralCode = candidate;
      await user.save();
      return candidate;
    }
  }

  throw ApiError.internal('Could not generate a unique referral code, please try again');
}

export async function applyReferralCode(userId: string, code: string): Promise<void> {
  const user = await UserModel.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  if (user.referredBy) throw ApiError.conflict('You have already applied a referral code');

  const referrer = await UserModel.findOne({ referralCode: code.toUpperCase() });
  if (!referrer) throw ApiError.badRequest('Invalid referral code');
  if (String(referrer._id) === String(user._id)) throw ApiError.badRequest('You cannot refer yourself');

  user.referredBy = referrer._id;
  await user.save();
}

/**
 * Called when an order transitions to DELIVERED. Rewards both sides of a
 * referral exactly once, on the referee's first delivered order — not on
 * placement — so a cancelled or fraudulent order can't be farmed for credit.
 */
export async function rewardReferralOnFirstDelivery(userId: string, orderId: string): Promise<void> {
  const user = await UserModel.findById(userId);
  if (!user?.referredBy) return;

  const alreadyRewarded = await referralRewardRepository.findByReferee(userId);
  if (alreadyRewarded) return;

  const deliveredOrderCount = await OrderModel.countDocuments({ userId, status: OrderStatus.DELIVERED });
  if (deliveredOrderCount !== 1) return;

  const referrerId = String(user.referredBy);

  await Promise.all([
    creditWallet(referrerId, REFERRAL_CONFIG.REFERRER_REWARD, WalletTransactionReason.REFERRAL, orderId, 'Referral reward'),
    creditWallet(userId, REFERRAL_CONFIG.REFEREE_REWARD, WalletTransactionReason.REFERRAL, orderId, 'Referral welcome bonus'),
  ]);

  await referralRewardRepository.create({
    referrerId,
    refereeId: userId,
    orderId,
    referrerReward: REFERRAL_CONFIG.REFERRER_REWARD,
    refereeReward: REFERRAL_CONFIG.REFEREE_REWARD,
  } as never);

  await notifyUser({
    userId: referrerId,
    type: NotificationType.WALLET,
    title: 'Referral reward credited!',
    message: `You earned ₹${REFERRAL_CONFIG.REFERRER_REWARD} because a friend you referred placed their first order.`,
    channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
  });
}

// ---------------------------------------------------------------------------
// Gift cards
// ---------------------------------------------------------------------------

function generateGiftCardCode(): string {
  return `GIFT-${randomCodeSuffix(10)}`;
}

export async function issueGiftCard(issuedById: string, input: IssueGiftCardInput) {
  return giftCardRepository.create({
    code: generateGiftCardCode(),
    initialValue: input.initialValue,
    balance: input.initialValue,
    issuedBy: issuedById,
    issuedToEmail: input.issuedToEmail,
    issuedToPhone: input.issuedToPhone,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    notes: input.notes,
  } as never);
}

export async function listGiftCards(page: number, limit: number) {
  return giftCardRepository.paginate({}, { page, limit, sort: { createdAt: -1 } });
}

export async function redeemGiftCard(userId: string, code: string) {
  const giftCard = await giftCardRepository.findActiveByCode(code);
  if (!giftCard) throw ApiError.badRequest('This gift card code is invalid or has already been redeemed');
  if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
    throw ApiError.badRequest('This gift card has expired');
  }

  giftCard.redeemedBy = userId as never;
  giftCard.redeemedAt = new Date();
  await giftCard.save();

  const wallet = await creditWallet(userId, giftCard.balance, WalletTransactionReason.GIFT_CARD, String(giftCard._id), `Gift card ${giftCard.code} redeemed`);

  await notifyUser({
    userId,
    type: NotificationType.WALLET,
    title: 'Gift card redeemed',
    message: `₹${giftCard.balance} has been added to your wallet.`,
    channels: [NotificationChannel.IN_APP],
  });

  return { giftCard, wallet };
}

// ---------------------------------------------------------------------------
// Flash sales
// ---------------------------------------------------------------------------

export async function createFlashSale(createdBy: string, input: CreateFlashSaleInput) {
  return flashSaleRepository.create({
    name: input.name,
    bannerImage: input.bannerImage,
    startAt: new Date(input.startAt),
    endAt: new Date(input.endAt),
    items: input.items,
    isActive: input.isActive,
    createdBy,
  } as never);
}

export async function updateFlashSale(flashSaleId: string, input: UpdateFlashSaleInput) {
  const flashSale = await flashSaleRepository.findById(flashSaleId);
  if (!flashSale) throw ApiError.notFound('Flash sale not found');

  if (input.name !== undefined) flashSale.name = input.name;
  if (input.bannerImage !== undefined) flashSale.bannerImage = input.bannerImage;
  if (input.startAt !== undefined) flashSale.startAt = new Date(input.startAt);
  if (input.endAt !== undefined) flashSale.endAt = new Date(input.endAt);
  if (input.items !== undefined) flashSale.items = input.items as never;
  if (input.isActive !== undefined) flashSale.isActive = input.isActive;

  await flashSale.save();
  return flashSale;
}

export async function listFlashSales() {
  return flashSaleRepository.find({});
}

export async function getActiveFlashSales() {
  return flashSaleRepository.findActiveNow();
}

/** Used by cart pricing to charge the flash price instead of the catalog price when a sale is live. */
export async function getActiveFlashPrice(medicineId: string): Promise<number | null> {
  const flashSale = await flashSaleRepository.findActiveForMedicine(medicineId);
  if (!flashSale) return null;
  const item = flashSale.items.find((i) => String(i.medicineId) === medicineId);
  return item?.flashPrice ?? null;
}
