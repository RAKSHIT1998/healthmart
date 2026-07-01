import { setupTestDB, teardownTestDB, clearDatabase } from './utils/db';
import { createCustomer, createMedicine } from './utils/fixtures';
import { cartRepository, couponRepository } from '../src/repositories';
import { computeCartTotals } from '../src/services/cart.service';
import { validateAndPriceCoupon } from '../src/services/coupon.service';
import { CouponType } from '@buymedicines/shared';
import { ApiError } from '../src/utils/ApiError';

beforeAll(setupTestDB);
afterAll(teardownTestDB);
afterEach(clearDatabase);

describe('Cart pricing', () => {
  it('computes subtotal, GST extraction, delivery fee and total correctly', async () => {
    const customer = await createCustomer();
    const medicine = await createMedicine({ sellingPrice: 112, mrp: 112, gstPercentage: 12 });

    const cart = await cartRepository.create({
      userId: customer._id,
      items: [{ medicineId: medicine._id, quantity: 2 }],
    } as never);

    const totals = await computeCartTotals(cart, String(customer._id));

    expect(totals.subtotal).toBe(224); // 112 * 2
    // GST extracted from a tax-inclusive price: 224 * 12 / 112 = 24
    expect(totals.gstAmount).toBeCloseTo(24, 1);
    // Below free-delivery threshold (499) -> standard delivery fee applies
    expect(totals.deliveryFee).toBe(29);
    expect(totals.totalAmount).toBe(224 + 29);
  });

  it('waives delivery fee above the free-delivery threshold', async () => {
    const customer = await createCustomer();
    const medicine = await createMedicine({ sellingPrice: 600, mrp: 600 });

    const cart = await cartRepository.create({
      userId: customer._id,
      items: [{ medicineId: medicine._id, quantity: 1 }],
    } as never);

    const totals = await computeCartTotals(cart, String(customer._id));
    expect(totals.deliveryFee).toBe(0);
  });
});

describe('Coupon validation and pricing', () => {
  it('applies a flat discount capped at the subtotal', async () => {
    const customer = await createCustomer();
    const coupon = await couponRepository.create({
      code: 'FLAT100',
      type: CouponType.FLAT,
      value: 100,
      minOrderValue: 0,
      usageLimitPerUser: 1,
      usedCount: 0,
      isActive: true,
      validFrom: new Date(Date.now() - 86400000),
      validTill: new Date(Date.now() + 86400000),
    } as never);

    const result = await validateAndPriceCoupon('FLAT100', String(customer._id), 50);
    expect(result.discountAmount).toBe(50); // capped at subtotal
    expect(String(result.coupon._id)).toBe(String(coupon._id));
  });

  it('applies a percentage discount capped at maxDiscount', async () => {
    const customer = await createCustomer();
    await couponRepository.create({
      code: 'SAVE20',
      type: CouponType.PERCENTAGE,
      value: 20,
      maxDiscount: 50,
      minOrderValue: 0,
      usageLimitPerUser: 1,
      usedCount: 0,
      isActive: true,
      validFrom: new Date(Date.now() - 86400000),
      validTill: new Date(Date.now() + 86400000),
    } as never);

    const result = await validateAndPriceCoupon('SAVE20', String(customer._id), 500);
    // 20% of 500 = 100, capped at 50
    expect(result.discountAmount).toBe(50);
  });

  it('rejects a coupon below the minimum order value', async () => {
    const customer = await createCustomer();
    await couponRepository.create({
      code: 'MIN200',
      type: CouponType.FLAT,
      value: 50,
      minOrderValue: 200,
      usageLimitPerUser: 1,
      usedCount: 0,
      isActive: true,
      validFrom: new Date(Date.now() - 86400000),
      validTill: new Date(Date.now() + 86400000),
    } as never);

    await expect(validateAndPriceCoupon('MIN200', String(customer._id), 100)).rejects.toThrow(ApiError);
  });

  it('rejects an expired coupon', async () => {
    const customer = await createCustomer();
    await couponRepository.create({
      code: 'EXPIRED',
      type: CouponType.FLAT,
      value: 50,
      minOrderValue: 0,
      usageLimitPerUser: 1,
      usedCount: 0,
      isActive: true,
      validFrom: new Date(Date.now() - 2 * 86400000),
      validTill: new Date(Date.now() - 86400000),
    } as never);

    await expect(validateAndPriceCoupon('EXPIRED', String(customer._id), 100)).rejects.toThrow(ApiError);
  });
});
