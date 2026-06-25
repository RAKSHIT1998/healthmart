import { BaseRepository } from './BaseRepository';
import { CouponModel, CouponRedemptionModel, type ICoupon, type ICouponRedemption } from '../models';

class CouponRepository extends BaseRepository<ICoupon> {
  constructor() {
    super(CouponModel);
  }

  async findActiveByCode(code: string) {
    const now = new Date();
    return this.model.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: now },
      validTill: { $gte: now },
    });
  }

  async incrementUsage(couponId: string) {
    return this.model.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } }, { new: true });
  }
}

class CouponRedemptionRepository extends BaseRepository<ICouponRedemption> {
  constructor() {
    super(CouponRedemptionModel);
  }

  async countForUser(couponId: string, userId: string) {
    return this.model.countDocuments({ couponId, userId });
  }
}

export const couponRepository = new CouponRepository();
export const couponRedemptionRepository = new CouponRedemptionRepository();
