/**
 * Outbound webhook dispatcher for Zapier/Make/custom integrations.
 *
 * Emits webhook events on key CRM actions to configured endpoints.
 *
 * @module lib/webhooks/outbound
 */

import { createLogger } from '@/lib/logger';

const log = createLogger('webhooks-outbound');

export type WebhookEventType =
  | 'deal.created'
  | 'deal.stage_changed'
  | 'deal.won'
  | 'deal.lost'
  | 'lead.created'
  | 'lead.converted'
  | 'lead.scored'
  | 'proposal.approved'
  | 'proposal.sent'
  | 'invoice.paid'
  | 'invoice.overdue'
  | 'client.created';

interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  organization_id: string;
  data: Record<string, unknown>;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string | null;
  events: WebhookEventType[];
  is_active: boolean;
}

/**
 * Dispatch a webhook event to all registered endpoints for the given org.
 * This is a fire-and-forget operation — failures are logged but don't throw.
 */
export async function dispatchWebhookEvent(
  organizationId: string,
  event: WebhookEventType,
  data: Record<string, unknown>,
  endpoints?: WebhookEndpoint[]
): Promise<void> {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    organization_id: organizationId,
    data,
  };

  // If no endpoints provided, attempt to load from settings
  const targets = endpoints ?? [];
  if (targets.length === 0) {
    // In production this would load from org settings or a webhooks table
    return;
  }

  const relevantEndpoints = targets.filter(
    (ep) => ep.is_active && (ep.events.includes(event) || ep.events.length === 0)
  );

  if (relevantEndpoints.length === 0) return;

  const body = JSON.stringify(payload);

  const dispatches = relevantEndpoints.map(async (endpoint) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-FlyteDeck-Event': event,
        'X-FlyteDeck-Timestamp': payload.timestamp,
      };

      if (endpoint.secret) {
        // HMAC signature for verification
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(endpoint.secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
        const sigHex = Array.from(new Uint8Array(sig))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        headers['X-FlyteDeck-Signature'] = `sha256=${sigHex}`;
      }

      const res = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (!res.ok) {
        log.error(`Webhook delivery failed: ${endpoint.url} (${res.status})`, {
          event,
          endpointId: endpoint.id,
        });
      } else {
        log.info(`Webhook delivered: ${event} → ${endpoint.url}`, {
          endpointId: endpoint.id,
        });
      }
    } catch (err) {
      log.error(
        `Webhook delivery error: ${endpoint.url}`,
        { event, endpointId: endpoint.id },
        err
      );
    }
  });

  await Promise.allSettled(dispatches);
}

/**
 * List all supported webhook event types.
 */
export const WEBHOOK_EVENT_TYPES: Array<{
  event: WebhookEventType;
  label: string;
  description: string;
}> = [
  { event: 'deal.created', label: 'Deal Created', description: 'A new deal is added to the pipeline.' },
  { event: 'deal.stage_changed', label: 'Deal Stage Changed', description: 'A deal moves to a different pipeline stage.' },
  { event: 'deal.won', label: 'Deal Won', description: 'A deal is marked as won (contract signed).' },
  { event: 'deal.lost', label: 'Deal Lost', description: 'A deal is marked as lost.' },
  { event: 'lead.created', label: 'Lead Created', description: 'A new lead is submitted via form or intake.' },
  { event: 'lead.converted', label: 'Lead Converted', description: 'A lead is converted to a deal and client.' },
  { event: 'lead.scored', label: 'Lead Scored', description: 'A lead receives a high score (≥70).' },
  { event: 'proposal.approved', label: 'Proposal Approved', description: 'A proposal is approved by the client.' },
  { event: 'proposal.sent', label: 'Proposal Sent', description: 'A proposal is sent to the client.' },
  { event: 'invoice.paid', label: 'Invoice Paid', description: 'An invoice is fully paid.' },
  { event: 'invoice.overdue', label: 'Invoice Overdue', description: 'An invoice becomes overdue.' },
  { event: 'client.created', label: 'Client Created', description: 'A new client record is created.' },
];
