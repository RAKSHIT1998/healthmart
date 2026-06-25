import { Types } from 'mongoose';
import { BaseRepository } from './BaseRepository';
import { ReviewModel, type IReview } from '../models';

class ReviewRepository extends BaseRepository<IReview> {
  constructor() {
    super(ReviewModel);
  }

  async listForMedicine(medicineId: string, page: number, limit: number) {
    return this.paginate({ medicineId, isApproved: true }, { page, limit, populate: 'userId' });
  }

  async getAggregateRating(medicineId: string) {
    const result = await this.model.aggregate<{ _id: null; average: number; count: number }>([
      { $match: { medicineId: new Types.ObjectId(medicineId), isApproved: true } },
      { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    return result[0] ?? { average: 0, count: 0 };
  }
}

export const reviewRepository = new ReviewRepository();
