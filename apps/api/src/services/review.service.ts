import type { CreateReviewInput } from '@buymedicines/shared';
import { medicineRepository, orderRepository, reviewRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import { OrderStatus } from '@buymedicines/shared';

async function refreshMedicineRating(medicineId: string): Promise<void> {
  const { average, count } = await reviewRepository.getAggregateRating(medicineId);
  await medicineRepository.updateRatingAggregate(medicineId, Math.round(average * 10) / 10, count);
}

export async function createReview(userId: string, input: CreateReviewInput) {
  const existing = await reviewRepository.findOne({ medicineId: input.medicineId, userId });
  if (existing) throw ApiError.conflict('You have already reviewed this medicine');

  if (input.orderId) {
    const order = await orderRepository.findOne({
      _id: input.orderId,
      userId,
      status: OrderStatus.DELIVERED,
    });
    if (!order) throw ApiError.badRequest('You can only review medicines from a delivered order');
  }

  const review = await reviewRepository.create({ ...input, userId } as never);
  await refreshMedicineRating(input.medicineId);
  return review;
}

export async function listReviewsForMedicine(medicineId: string, page: number, limit: number) {
  return reviewRepository.listForMedicine(medicineId, page, limit);
}

export async function moderateReview(reviewId: string, isApproved: boolean) {
  const review = await reviewRepository.updateById(reviewId, { isApproved });
  if (!review) throw ApiError.notFound('Review not found');
  await refreshMedicineRating(String(review.medicineId));
  return review;
}
