import { Schema, model, Types, type Document } from 'mongoose';
import { NotificationChannel, NotificationType } from '@healthmart/shared';
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
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    channel: { type: String, enum: Object.values(NotificationChannel), required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

toJSONPlugin(notificationSchema);

export const NotificationModel = model<INotification>('Notification', notificationSchema);
