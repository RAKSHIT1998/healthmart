import type { Response } from 'express';
import type { PaginationQuery } from '@buymedicines/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { notificationRepository, userRepository } from '../repositories';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const [{ items, pagination }, unreadCount] = await Promise.all([
    notificationRepository.listForUser(req.user!.id, page, limit),
    notificationRepository.countUnread(req.user!.id),
  ]);
  sendSuccess(res, items, 'Success', 200, { pagination, unreadCount });
});

export const markRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const notification = await notificationRepository.markAsRead(req.params.id as string, req.user!.id);
  sendSuccess(res, notification, 'Notification marked as read');
});

export const markAllRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await notificationRepository.markAllAsRead(req.user!.id);
  sendSuccess(res, null, 'All notifications marked as read');
});

export const registerFcmToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await userRepository.updateOne({ _id: req.user!.id }, { $addToSet: { fcmTokens: req.body.token } });
  sendSuccess(res, null, 'Device registered for push notifications');
});
