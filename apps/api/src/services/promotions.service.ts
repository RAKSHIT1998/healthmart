import crypto from 'crypto';
import {
  NotificationChannel,
  NotificationType,
  OrderStatus,
  REFERRAL_CONFIG,
  Role,
  WalletTransactionReason,
  type CreateFlashSaleInput,
  type IssueGiftCardInput,
  type SendEmailCampaignInput,
  type UpdateFlashSaleInput,
} from '@buymedicines/shared';
import { EmailCampaignModel, OrderModel, UserModel } from '../models';
import { flashSaleRepository, giftCardRepository, referralRewardRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import { creditWallet } from './wallet.service';
import { notifyUser } from './notification.service';
import { sendEmail, sendMarketingCampaignEmail } from '../integrations/resend';

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

  const order = await OrderModel.findById(orderId);
  if (!order) return;

  const referrerId = String(user.referredBy);
  const referrerReward = Math.round(order.totalAmount * (REFERRAL_CONFIG.REFERRER_REWARD_PERCENT / 100) * 100) / 100;
  const refereeReward = Math.round(order.totalAmount * (REFERRAL_CONFIG.REFEREE_REWARD_PERCENT / 100) * 100) / 100;

  await Promise.all([
    creditWallet(referrerId, referrerReward, WalletTransactionReason.REFERRAL, orderId, 'Referral reward'),
    creditWallet(userId, refereeReward, WalletTransactionReason.REFERRAL, orderId, 'Referral welcome bonus'),
  ]);

  await referralRewardRepository.create({
    referrerId,
    refereeId: userId,
    orderId,
    referrerReward,
    refereeReward,
  } as never);

  await notifyUser({
    userId: referrerId,
    type: NotificationType.WALLET,
    title: 'Referral reward credited!',
    message: `You earned ₹${referrerReward} (${REFERRAL_CONFIG.REFERRER_REWARD_PERCENT}%) because a friend you referred placed their first order.`,
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
  const giftCard = await giftCardRepository.create({
    code: generateGiftCardCode(),
    initialValue: input.initialValue,
    balance: input.initialValue,
    issuedBy: issuedById,
    issuedToEmail: input.issuedToEmail,
    issuedToPhone: input.issuedToPhone,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    notes: input.notes,
  } as never);

  if (giftCard.issuedToEmail) {
    await sendEmail({
      to: giftCard.issuedToEmail,
      subject: `Your BuyMedicines.store gift card: ${giftCard.code}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.7;color:#334155;">
          <h2 style="color:#0f766e;">You received a gift card</h2>
          <p>Your gift card code is <strong>${giftCard.code}</strong>.</p>
          <p>Initial value: <strong>Rs. ${giftCard.initialValue.toFixed(2)}</strong></p>
          ${giftCard.expiresAt ? `<p>Expires on: ${giftCard.expiresAt.toDateString()}</p>` : ''}
          <p>Use it at checkout or redeem it in your wallet area.</p>
        </div>`,
    });
  }

  return giftCard;
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

function marketingAudienceFilter(audience: 'all' | 'customers' | 'staff') {
  if (audience === 'customers') return { role: Role.CUSTOMER };
  if (audience === 'staff') return { role: { $ne: Role.CUSTOMER } };
  return {};
}

export async function sendEmailCampaign(createdBy: string, input: SendEmailCampaignInput) {
  const campaign = await EmailCampaignModel.create({
    ...input,
    status: 'draft',
    createdBy,
  });

  const query: Record<string, unknown> = {
    isActive: true,
    email: { $exists: true, $ne: null },
    ...marketingAudienceFilter(input.audience),
  };
  if (input.sendToSubscribedOnly) {
    query['notificationPreferences.email'] = { $ne: false };
  }
  if (input.testEmail) {
    query.email = input.testEmail.toLowerCase();
  }

  const recipients = await UserModel.find(query).select('email');
  campaign.recipientsCount = recipients.length;

  let deliveredCount = 0;
  let failedCount = 0;
  let lastError = '';

  for (const recipient of recipients) {
    if (!recipient.email) continue;
    try {
      await sendMarketingCampaignEmail({
        to: recipient.email,
        subject: input.subject,
        previewText: input.previewText,
        headline: input.headline,
        body: input.body,
        ctaLabel: input.ctaLabel,
        ctaUrl: input.ctaUrl,
      });
      deliveredCount += 1;
    } catch (err) {
      failedCount += 1;
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  campaign.deliveredCount = deliveredCount;
  campaign.failedCount = failedCount;
  campaign.lastError = lastError || undefined;
  campaign.status = failedCount > 0 && deliveredCount === 0 ? 'failed' : 'sent';
  campaign.sentAt = new Date();
  await campaign.save();

  return campaign;
}

export async function listEmailCampaigns() {
  return EmailCampaignModel.find().sort({ createdAt: -1 }).populate('createdBy', 'name email');
}
