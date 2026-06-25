import { CouponType, type CreateCouponInput, type UpdateCouponInput } from '@healthmart/shared';
import { couponRedemptionRepository, couponRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import type { ICoupon } from '../models';

export interface CouponDiscountResult {
  coupon: ICoupon;
  discountAmount: number;
  freeDelivery: boolean;
}

export async function validateAndPriceCoupon(
  code: string,
  userId: string,
  subtotal: number,
): Promise<CouponDiscountResult> {
  const coupon = await couponRepository.findActiveByCode(code);
  if (!coupon) {
    throw ApiError.badRequest('This coupon is invalid or has expired');
  }
  if (subtotal < coupon.minOrderValue) {
    throw ApiError.badRequest(`Add items worth ₹${coupon.minOrderValue} or more to use this coupon`);
  }
  if (coupon.totalUsageLimit && coupon.usedCount >= coupon.totalUsageLimit) {
    throw ApiError.badRequest('This coupon has reached its usage limit');
  }

  const userUsageCount = await couponRedemptionRepository.countForUser(String(coupon._id), userId);
  if (userUsageCount >= coupon.usageLimitPerUser) {
    throw ApiError.badRequest('You have already used this coupon the maximum number of times');
  }

  let discountAmount = 0;
  let freeDelivery = false;

  if (coupon.type === CouponType.FLAT) {
    discountAmount = Math.min(coupon.value, subtotal);
  } else if (coupon.type === CouponType.PERCENTAGE) {
    discountAmount = (subtotal * coupon.value) / 100;
    if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
  } else if (coupon.type === CouponType.FREE_DELIVERY) {
    freeDelivery = true;
  }

  return { coupon, discountAmount: Math.round(discountAmount * 100) / 100, freeDelivery };
}

export async function recordCouponRedemption(couponId: string, userId: string, orderId: string, discountAmount: number) {
  await Promise.all([
    couponRedemptionRepository.create({ couponId, userId, orderId, discountAmount } as never),
    couponRepository.incrementUsage(couponId),
  ]);
}

export async function listCoupons(activeOnly = false) {
  return couponRepository.find(activeOnly ? { isActive: true } : {});
}

export async function createCoupon(input: CreateCouponInput) {
  const existing = await couponRepository.findOne({ code: input.code });
  if (existing) throw ApiError.conflict('A coupon with this code already exists');
  return couponRepository.create(input as never);
}

export async function updateCoupon(couponId: string, input: UpdateCouponInput) {
  const coupon = await couponRepository.findById(couponId);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  Object.assign(coupon, input);
  await coupon.save();
  return coupon;
}

export async function deleteCoupon(couponId: string) {
  const coupon = await couponRepository.findById(couponId);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  coupon.isActive = false;
  await coupon.save();
}
