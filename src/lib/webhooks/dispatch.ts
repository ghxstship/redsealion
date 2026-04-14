/**
 * Convenience webhook dispatcher for API routes.
 * Wraps the core outbound module with a simpler interface.
 */

import { dispatchWebhookEvent, type WebhookEventType } from './outbound';
import { createLogger } from '@/lib/logger';

const log = createLogger('webhooks-dispatch');

/**
 * Dispatch a webhook event. Fire-and-forget.
 * Accepts any event string — unsubscribed events are silently ignored.
 */
export async function dispatchWebhook(
  event: string,
  data: Record<string, unknown> | string,
  organizationId: string,
): Promise<void> {
  try {
    const payload = typeof data === 'object' ? data : { id: data };
    await dispatchWebhookEvent(organizationId, event as WebhookEventType, payload);
  } catch (err) {
    log.error('dispatchWebhook failed', { event, organizationId }, err);
  }
}
