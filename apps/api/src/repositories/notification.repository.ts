import { BaseRepository } from './BaseRepository';
import { NotificationModel, type INotification } from '../models';

class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(NotificationModel);
  }

  async listForUser(userId: string, page: number, limit: number) {
    return this.paginate({ userId }, { page, limit });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.model.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { isRead: true } },
      { new: true },
    );
  }

  async markAllAsRead(userId: string) {
    return this.model.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
  }

  async countUnread(userId: string) {
    return this.model.countDocuments({ userId, isRead: false });
  }
}

export const notificationRepository = new NotificationRepository();
