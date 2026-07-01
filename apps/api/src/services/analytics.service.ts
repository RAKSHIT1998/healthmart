import { OrderStatus, PaymentStatus } from '@buymedicines/shared';
import { analyticsRepository, inventoryRepository, medicineRepository, orderRepository } from '../repositories';
import { OrderModel, UserModel } from '../models';
import * as inventoryService from './inventory.service';
import { getOrSetCache } from '../utils/cache';

const DASHBOARD_CACHE_TTL_SECONDS = 60;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function getDashboardMetrics(branchId?: string) {
  return getOrSetCache(`dashboard:${branchId ?? 'all'}`, DASHBOARD_CACHE_TTL_SECONDS, async () => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const monthStart = startOfMonth(now);

    const [today, month, totalCustomers, lowStock, expiringSoon, inventoryValue, cancelledToday] = await Promise.all([
      analyticsRepository.getRevenueBetween(branchId, todayStart, now),
      analyticsRepository.getRevenueBetween(branchId, monthStart, now),
      UserModel.countDocuments({ role: 'customer' }),
      inventoryService.getLowStock(branchId),
      inventoryService.getExpiringSoon(branchId),
      inventoryService.getInventoryValue(branchId),
      orderRepository.countByStatusInRange(OrderStatus.CANCELLED, todayStart, now),
    ]);

    const averageOrderValue = today.orders > 0 ? today.revenue / today.orders : 0;

    return {
      todaySales: Math.round(today.revenue * 100) / 100,
      todayOrders: today.orders,
      monthlySales: Math.round(month.revenue * 100) / 100,
      monthlyOrders: month.orders,
      totalCustomers,
      cancelledOrdersToday: cancelledToday,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      lowStockCount: lowStock.length,
      expiringSoonCount: expiringSoon.length,
    };
  });
}

export async function getTopMedicines(limit = 10) {
  return medicineRepository.find({ isActive: true }, { sort: { salesCount: -1 }, limit });
}

export async function getSalesTrend(days = 30, branchId?: string) {
  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);

  const trend = await OrderModel.aggregate<{ _id: string; revenue: number; orders: number }>([
    {
      $match: {
        ...(branchId ? { branchId } : {}),
        createdAt: { $gte: from },
        paymentStatus: PaymentStatus.PAID,
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return trend.map((t) => ({ date: t._id, revenue: t.revenue, orders: t.orders }));
}

export async function getInventoryAlerts(branchId?: string) {
  const [lowStock, expiringSoon] = await Promise.all([
    inventoryRepository.findLowStock(branchId),
    inventoryService.getExpiringSoon(branchId),
  ]);
  return { lowStock, expiringSoon };
}
