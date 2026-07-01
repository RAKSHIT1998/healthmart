import { Schema, model, Types, type Document } from 'mongoose';
import { NotificationChannel, NotificationType } from '@buymedicines/shared';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  channel: NotificationChannel;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    channel: { type: String, enum: Object.values(NotificationChannel), required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Matches listForUser's exact filter+sort (userId, newest first) and the unread-count query.
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

toJSONPlugin(notificationSchema);

export const NotificationModel = model<INotification>('Notification', notificationSchema);
