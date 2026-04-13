import { createServiceClient } from '@/lib/supabase/server';
import { ResendEmailProvider } from './email';
import { TwilioSmsProvider } from './sms';

import type { EmailProvider } from './email';
import type { SmsProvider } from './sms';

import { createLogger } from '@/lib/logger';

const log = createLogger('notification-dispatcher');

interface SendNotificationOptions {
  orgId: string;
  userId: string;
  eventType: string;
  channel: 'email' | 'sms';
  subject?: string;
  body: string;
  to: string;
}

// Singleton instances so we don't recreate on every call
let emailProvider: EmailProvider | null = null;
let smsProvider: SmsProvider | null = null;

function getEmailProvider(): EmailProvider {
  if (!emailProvider) {
    emailProvider = new ResendEmailProvider();
  }
  return emailProvider;
}

function getSmsProvider(): SmsProvider {
  if (!smsProvider) {
    smsProvider = new TwilioSmsProvider();
  }
  return smsProvider;
}

/**
 * Send a notification via the specified channel and log it to the
 * `email_notifications` table for audit purposes.
 */
export async function sendNotification(opts: SendNotificationOptions): Promise<void> {
  const { orgId, userId, eventType, channel, subject, body, to } = opts;

  let error: string | null = null;

  try {
    if (channel === 'email') {
      const provider = getEmailProvider();
      await provider.send(to, subject ?? eventType, body);
    } else if (channel === 'sms') {
      const provider = getSmsProvider();
      await provider.send(to, body);
    } else {
      log.warn(`[Notifications] Unknown channel: ${channel}`, {});
      return;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    log.error(`[Notifications] Failed to send ${channel} notification:`, {}, err);
  }

  // Log to the database regardless of success/failure
  try {
    const supabase = await createServiceClient();

    await supabase.from('email_notifications').insert({
      organization_id: orgId,
      recipient_email: channel === 'email' ? to : null,
      recipient_phone: channel === 'sms' ? to : null,
      subject: subject ?? eventType,
      body,
      type: eventType,
      channel,
      user_id: userId,
      sent_at: error ? null : new Date().toISOString(),
      error,
    });
  } catch (dbErr) {
    log.error('[Notifications] Failed to log notification:', {}, dbErr);
  }
}
