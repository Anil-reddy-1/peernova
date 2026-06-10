import { Resend } from 'resend';
import { getMessaging } from './firebase-admin';
import { logger } from './pino';

// Resend Email Setup
const resendApiKey = process.env.RESEND_API_KEY || 're_dummy_key';
export const resend = new Resend(resendApiKey);

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    if (resendApiKey === 're_dummy_key') {
      logger.info({ to, subject }, 'Mock email sent (no RESEND_API_KEY configured)');
      return;
    }
    await resend.emails.send({
      from: 'PeerNova <noreply@peernova.com>', // Replace with actual verified domain
      to,
      subject,
      html,
    });
    logger.info({ to, subject }, 'Email sent successfully');
  } catch (error) {
    logger.error({ error, to }, 'Failed to send email');
  }
}

// Firebase Cloud Messaging Setup
export async function sendPushNotification(token: string | string[], title: string, body: string, data?: Record<string, string>): Promise<void> {
  try {
    const messaging = getMessaging();
    const messagePayload = {
      notification: { title, body },
      data,
    };

    if (Array.isArray(token)) {
      if (token.length === 0) return;
      const response = await messaging.sendEachForMulticast({ ...messagePayload, tokens: token });
      if (response.failureCount > 0) {
        logger.warn({ failures: response.responses.filter(r => !r.success) }, 'Some push notifications failed to send');
      }
    } else {
      await messaging.send({ ...messagePayload, token });
    }
    logger.info({ tokens: Array.isArray(token) ? token.length : 1 }, 'Push notification sent');
  } catch (error) {
    logger.error({ error }, 'Failed to send push notification');
  }
}
