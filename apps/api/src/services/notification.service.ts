import { NotificationChannel, NotificationType } from '@healthmart/shared';
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
