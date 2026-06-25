import { Types } from 'mongoose';
import { OrderStatus, PaymentStatus } from '@healthmart/shared';
import { BaseRepository } from './BaseRepository';
import { AnalyticsSnapshotModel, OrderModel, UserModel, type IAnalyticsSnapshot } from '../models';

class AnalyticsRepository extends BaseRepository<IAnalyticsSnapshot> {
  constructor() {
    super(AnalyticsSnapshotModel);
  }

  async upsertDailySnapshot(date: string, branchId: string) {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);
    const branchObjectId = new Types.ObjectId(branchId);

    const [orderStats, newCustomers] = await Promise.all([
      OrderModel.aggregate<{
        _id: null;
        totalOrders: number;
        totalRevenue: number;
        totalDiscount: number;
        cancelledOrders: number;
      }>([
        { $match: { branchId: branchObjectId, createdAt: { $gte: dayStart, $lte: dayEnd } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', PaymentStatus.PAID] }, '$totalAmount', 0] },
            },
            totalDiscount: { $sum: '$discount' },
            cancelledOrders: {
              $sum: { $cond: [{ $eq: ['$status', OrderStatus.CANCELLED] }, 1, 0] },
            },
          },
        },
      ]),
      UserModel.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
    ]);

    const stats = orderStats[0] ?? {
      totalOrders: 0,
      totalRevenue: 0,
      totalDiscount: 0,
      cancelledOrders: 0,
    };
    const averageOrderValue = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;

    return this.model.findOneAndUpdate(
      { date, branchId },
      {
        $set: {
          totalOrders: stats.totalOrders,
          totalRevenue: stats.totalRevenue,
          totalDiscount: stats.totalDiscount,
          cancelledOrders: stats.cancelledOrders,
          newCustomers,
          averageOrderValue,
        },
      },
      { upsert: true, new: true },
    );
  }

  async getRevenueBetween(branchId: string | undefined, from: Date, to: Date) {
    const result = await OrderModel.aggregate<{ _id: null; revenue: number; orders: number }>([
      {
        $match: {
          ...(branchId ? { branchId: new Types.ObjectId(branchId) } : {}),
          createdAt: { $gte: from, $lte: to },
          paymentStatus: PaymentStatus.PAID,
        },
      },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
    ]);
    return result[0] ?? { revenue: 0, orders: 0 };
  }
}

export const analyticsRepository = new AnalyticsRepository();
