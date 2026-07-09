import { NotificationChannel, NotificationType, Role } from '@buymedicines/shared';
import { notificationRepository } from '../repositories';
import { UserModel } from '../models';
import { sendTransactionalSms, sendWhatsAppMessage } from '../integrations/msg91';
import { sendEmail } from '../integrations/resend';
import { sendPushNotification } from '../integrations/firebase';
import { logger } from '../config/logger';

interface NotifyParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  channels?: NotificationChannel[];
  data?: Record<string, unknown>;
}

interface NotifyStaffNewOrderParams {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  branchId?: string;
}

/**
 * Persists an in-app notification and best-effort dispatches it across the
 * requested channels. Failures on any one channel are logged, not thrown —
 * a missing SMS provider key should never fail the underlying business
 * operation (e.g. placing an order).
 */
export async function notifyUser({
  userId,
  type,
  title,
  message,
  channels = [NotificationChannel.IN_APP],
  data,
}: NotifyParams): Promise<void> {
  await notificationRepository.create({
    userId,
    channel: channels[0] ?? NotificationChannel.IN_APP,
    type,
    title,
    message,
    data,
  } as never);

  const user = await UserModel.findById(userId);
  if (!user) return;

  const prefs = user.notificationPreferences;

  for (const channel of channels) {
    // IN_APP is always recorded above regardless of preference — these opt-outs only govern
    // outbound SMS/email/push/WhatsApp sends, not the in-app notification list itself.
    if (channel === NotificationChannel.SMS && prefs?.sms === false) continue;
    if (channel === NotificationChannel.EMAIL && prefs?.email === false) continue;
    if (channel === NotificationChannel.PUSH && prefs?.push === false) continue;
    if (channel === NotificationChannel.WHATSAPP && prefs?.whatsapp === false) continue;

    try {
      if (channel === NotificationChannel.SMS && user.phone) {
        await sendTransactionalSms(user.phone, 'order_update', { title, message });
      } else if (channel === NotificationChannel.EMAIL && user.email) {
        await sendEmail({ to: user.email, subject: title, html: `<p>${message}</p>` });
      } else if (channel === NotificationChannel.PUSH && user.fcmTokens.length > 0) {
        await sendPushNotification({ tokens: user.fcmTokens, title, body: message, data: data as Record<string, string> });
      } else if (channel === NotificationChannel.WHATSAPP && user.phone) {
        await sendWhatsAppMessage({ phone: user.phone, bodyParams: [title, message] });
      }
    } catch (err) {
      logger.error({ err, channel, userId }, 'Notification dispatch failed');
    }
  }
}

export async function notifyStaffNewOrder({
  orderId,
  orderNumber,
  totalAmount,
  branchId,
}: NotifyStaffNewOrderParams): Promise<void> {
  const staffUsers = await UserModel.find({
    isActive: true,
    role: { $in: [Role.ADMIN, Role.MANAGER, Role.PHARMACIST, Role.INVENTORY_MANAGER] },
  }).select('_id');

  if (staffUsers.length === 0) return;

  const title = `New order ${orderNumber}`;
  const message = `A customer placed a new order worth Rs. ${Math.round(totalAmount)}.`;

  await Promise.all(
    staffUsers.map((staffUser) =>
      notificationRepository.create({
        userId: String(staffUser._id),
        channel: NotificationChannel.IN_APP,
        type: NotificationType.ORDER_UPDATE,
        title,
        message,
        data: { orderId, orderNumber, totalAmount, branchId },
      } as never),
    ),
  );
}
