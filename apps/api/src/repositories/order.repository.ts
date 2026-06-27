import type { FilterQuery } from 'mongoose';
import { OrderStatus, type PaginationQuery } from '@healthmart/shared';
import { buildPaginationMeta } from '../utils/apiResponse';
import { BaseRepository } from './BaseRepository';
import { OrderModel, type IOrder, type IStatusHistoryEntry } from '../models';

interface AdminOrderFilters extends PaginationQuery {
  status?: OrderStatus;
  branchId?: string;
  userId?: string;
}

class OrderRepository extends BaseRepository<IOrder> {
  constructor() {
    super(OrderModel);
  }

  async findByOrderNumber(orderNumber: string) {
    return this.model.findOne({ orderNumber });
  }

  async findByCashfreeOrderId(cashfreeOrderId: string) {
    return this.model.findOne({ cashfreeOrderId });
  }

  async listForUser(userId: string, pagination: PaginationQuery) {
    return this.paginate({ userId }, { page: pagination.page, limit: pagination.limit });
  }

  async listForAdmin(filters: AdminOrderFilters) {
    const filter: FilterQuery<IOrder> = {};
    if (filters.status) filter.status = filters.status;
    if (filters.branchId) filter.branchId = filters.branchId;
    if (filters.userId) filter.userId = filters.userId;

    return this.paginate(filter, {
      page: filters.page,
      limit: filters.limit,
      populate: 'userId driverId',
    });
  }

  async listForDriver(driverId: string, pagination: PaginationQuery) {
    return this.paginate(
      { driverId, status: { $in: [OrderStatus.PACKED, OrderStatus.OUT_FOR_DELIVERY] } },
      { page: pagination.page, limit: pagination.limit },
    );
  }

  /** Order IDs a driver is actively out delivering — used to fan out live location pushes. */
  async findActiveDeliveryOrderIds(driverId: string): Promise<string[]> {
    const orders = await this.model.find({ driverId, status: OrderStatus.OUT_FOR_DELIVERY }, '_id');
    return orders.map((o) => String(o._id));
  }

  async appendStatusHistory(orderId: string, entry: IStatusHistoryEntry) {
    return this.model.findByIdAndUpdate(
      orderId,
      { $set: { status: entry.status }, $push: { statusHistory: entry } },
      { new: true },
    );
  }

  /** Orders stuck in pending_payment past their reservation hold — the cron sweep cancels these and releases stock. */
  async findExpiredReservations() {
    return this.model.find({
      status: OrderStatus.PENDING_PAYMENT,
      reservationExpiresAt: { $lte: new Date() },
    });
  }

  async countByStatusInRange(status: OrderStatus, from: Date, to: Date) {
    return this.model.countDocuments({ status, createdAt: { $gte: from, $lte: to } });
  }

  buildPagination(total: number, page: number, limit: number) {
    return buildPaginationMeta(total, page, limit);
  }
}

export const orderRepository = new OrderRepository();
