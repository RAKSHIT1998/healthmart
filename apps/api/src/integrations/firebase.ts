import admin from 'firebase-admin';
import { env } from '../config/env';
import { logger } from '../config/logger';

let app: admin.app.App | null = null;

function getApp(): admin.app.App | null {
  if (app) return app;
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    return null;
  }

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
  return app;
}

interface PushNotificationParams {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPushNotification({
  tokens,
  title,
  body,
  data,
}: PushNotificationParams): Promise<void> {
  const firebaseApp = getApp();
  if (!firebaseApp || tokens.length === 0) {
    logger.warn(`[Firebase not configured] Push to ${tokens.length} device(s): ${title}`);
    return;
  }

  try {
    await admin.messaging(firebaseApp).sendEachForMulticast({
      tokens,
      notification: { title, body },
      data,
    });
  } catch (err) {
    logger.error({ err }, 'Firebase push notification failed');
  }
}
