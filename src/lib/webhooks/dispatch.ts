/**
 * Convenience webhook dispatcher for API routes.
 * Wraps the core outbound module with a simpler interface.
 */

import { dispatchWebhookEvent } from './outbound';
import { createLogger } from '@/lib/logger';

const log = createLogger('webhooks-dispatch');

/**
 * Dispatch a webhook event. Fire-and-forget.
 * Accepts any event string — unsubscribed events are silently ignored.
 */
export async function dispatchWebhook(
  event: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  organizationId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _supabase?: any,
): Promise<void> {
  try {
    // Cast to the known union type — if the event isn't registered,
    // dispatchWebhookEvent handles it gracefully (no matching endpoints).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await dispatchWebhookEvent(organizationId, event as any, typeof data === 'object' ? data : { id: data });
  } catch (err) {
    log.error('dispatchWebhook failed', { event, organizationId }, err);
  }
}
