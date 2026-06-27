import { setupTestDB, teardownTestDB, clearDatabase } from './utils/db';
import { createBranch, createCustomer, createMedicine, createOrder } from './utils/fixtures';
import { OrderStatus } from '@healthmart/shared';
import {
  applyReferralCode,
  getOrCreateReferralCode,
  issueGiftCard,
  redeemGiftCard,
  rewardReferralOnFirstDelivery,
  createFlashSale,
  getActiveFlashPrice,
} from '../src/services/promotions.service';
import { getWallet } from '../src/services/wallet.service';
import { cartRepository } from '../src/repositories';
import { computeCartTotals } from '../src/services/cart.service';
import { ApiError } from '../src/utils/ApiError';

beforeAll(setupTestDB);
afterAll(teardownTestDB);
afterEach(clearDatabase);

describe('Referral program', () => {
  it('rewards both referrer and referee exactly once, on the referee first delivered order', async () => {
    const branch = await createBranch();
    const medicine = await createMedicine();
    const referrer = await createCustomer({ name: 'Referrer One' });
    const referee = await createCustomer({ name: 'Referee Two' });

    const code = await getOrCreateReferralCode(String(referrer._id));
    await applyReferralCode(String(referee._id), code);

    const order = await createOrder({
      userId: referee._id,
      branchId: branch._id,
      medicineId: medicine._id,
      status: OrderStatus.DELIVERED,
    });

    await rewardReferralOnFirstDelivery(String(referee._id), String(order._id));

    const referrerWallet = await getWallet(String(referrer._id));
    const refereeWallet = await getWallet(String(referee._id));
    expect(referrerWallet.balance).toBe(100);
    expect(refereeWallet.balance).toBe(50);

    // A second delivered order for the same referee must not double-reward.
    const secondOrder = await createOrder({
      userId: referee._id,
      branchId: branch._id,
      medicineId: medicine._id,
      status: OrderStatus.DELIVERED,
    });
    await rewardReferralOnFirstDelivery(String(referee._id), String(secondOrder._id));

    const referrerWalletAfter = await getWallet(String(referrer._id));
    expect(referrerWalletAfter.balance).toBe(100);
  });

  it('rejects self-referral and reusing a code once already applied', async () => {
    const user = await createCustomer();
    const code = await getOrCreateReferralCode(String(user._id));

    await expect(applyReferralCode(String(user._id), code)).rejects.toThrow(ApiError);

    const other = await createCustomer();
    const referrer = await createCustomer();
    const referrerCode = await getOrCreateReferralCode(String(referrer._id));
    await applyReferralCode(String(other._id), referrerCode);

    await expect(applyReferralCode(String(other._id), referrerCode)).rejects.toThrow(ApiError);
  });
});

describe('Gift cards', () => {
  it('credits the redeemer wallet and cannot be redeemed twice', async () => {
    const admin = await createCustomer({ name: 'Admin Issuer' });
    const customer = await createCustomer();

    const giftCard = await issueGiftCard(String(admin._id), { initialValue: 250 });
    const { wallet } = await redeemGiftCard(String(customer._id), giftCard.code);

    expect(wallet.balance).toBe(250);

    await expect(redeemGiftCard(String(customer._id), giftCard.code)).rejects.toThrow(ApiError);
  });
});

describe('Flash sales', () => {
  it('overrides the catalog price in cart computation while the sale is active', async () => {
    const customer = await createCustomer();
    const medicine = await createMedicine({ sellingPrice: 200, mrp: 200 });

    await createFlashSale(String(customer._id), {
      name: 'Weekend Flash Sale',
      startAt: new Date(Date.now() - 60_000).toISOString(),
      endAt: new Date(Date.now() + 60_000).toISOString(),
      items: [{ medicineId: String(medicine._id), flashPrice: 120 }],
      isActive: true,
    });

    const activePrice = await getActiveFlashPrice(String(medicine._id));
    expect(activePrice).toBe(120);

    const cart = await cartRepository.create({ userId: customer._id, items: [{ medicineId: medicine._id, quantity: 1 }] } as never);
    const totals = await computeCartTotals(cart, String(customer._id));

    expect(totals.items[0]!.sellingPrice).toBe(120);
    expect(totals.subtotal).toBe(120);
  });

  it('does not apply an expired flash sale price', async () => {
    const customer = await createCustomer();
    const medicine = await createMedicine({ sellingPrice: 200, mrp: 200 });

    await createFlashSale(String(customer._id), {
      name: 'Expired Sale',
      startAt: new Date(Date.now() - 120_000).toISOString(),
      endAt: new Date(Date.now() - 60_000).toISOString(),
      items: [{ medicineId: String(medicine._id), flashPrice: 50 }],
      isActive: true,
    });

    const activePrice = await getActiveFlashPrice(String(medicine._id));
    expect(activePrice).toBeNull();
  });
});
