import { BaseRepository } from './BaseRepository';
import { FlashSaleModel, GiftCardModel, ReferralRewardModel, type IFlashSale, type IGiftCard, type IReferralReward } from '../models';

class GiftCardRepository extends BaseRepository<IGiftCard> {
  constructor() {
    super(GiftCardModel);
  }

  async findActiveByCode(code: string) {
    return this.model.findOne({ code: code.toUpperCase(), isActive: true, redeemedBy: { $exists: false } });
  }
}

class FlashSaleRepository extends BaseRepository<IFlashSale> {
  constructor() {
    super(FlashSaleModel);
  }

  async findActiveNow() {
    const now = new Date();
    return this.model.find({ isActive: true, startAt: { $lte: now }, endAt: { $gte: now } });
  }

  async findActiveForMedicine(medicineId: string) {
    const now = new Date();
    return this.model.findOne({
      isActive: true,
      startAt: { $lte: now },
      endAt: { $gte: now },
      'items.medicineId': medicineId,
    });
  }
}

class ReferralRewardRepository extends BaseRepository<IReferralReward> {
  constructor() {
    super(ReferralRewardModel);
  }

  async findByReferee(refereeId: string) {
    return this.model.findOne({ refereeId });
  }
}

export const giftCardRepository = new GiftCardRepository();
export const flashSaleRepository = new FlashSaleRepository();
export const referralRewardRepository = new ReferralRewardRepository();
