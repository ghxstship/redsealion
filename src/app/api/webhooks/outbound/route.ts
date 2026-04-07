import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/api/permission-guard';
import { WEBHOOK_EVENT_TYPES, type WebhookEventType } from '@/lib/webhooks/outbound';
import { createLogger } from '@/lib/logger';

const log = createLogger('api-webhooks');

/**
 * GET /api/webhooks/outbound
 * Lists supported webhook event types for the org.
 */
export async function GET() {
  try {
    const permError = await requirePermission('settings', 'view');
    if (permError) return permError;

    return NextResponse.json({ events: WEBHOOK_EVENT_TYPES });
  } catch (err) {
    log.error('Failed to list webhook events', {}, err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks/outbound
 * Test a webhook endpoint by sending a test event.
 */
export async function POST(request: NextRequest) {
  try {
    const permError = await requirePermission('settings', 'edit');
    if (permError) return permError;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, event, secret } = body as {
      url?: string;
      event?: WebhookEventType;
      secret?: string;
    };

    if (!url) {
      return NextResponse.json(
        { error: 'url is required.' },
        { status: 400 }
      );
    }

    const testEvent = event || 'deal.created';
    const testPayload = {
      event: testEvent,
      timestamp: new Date().toISOString(),
      organization_id: 'test',
      data: {
        id: 'test_' + crypto.randomUUID().slice(0, 8),
        message: 'This is a test webhook delivery from FlyteDeck.',
      },
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-FlyteDeck-Event': testEvent,
      'X-FlyteDeck-Timestamp': testPayload.timestamp,
    };

    if (secret) {
      const encoder = new TextEncoder();
      const payloadStr = JSON.stringify(testPayload);
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadStr));
      const sigHex = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      headers['X-FlyteDeck-Signature'] = `sha256=${sigHex}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10000),
    });

    log.info(`Test webhook delivered to ${url}: ${res.status}`);

    return NextResponse.json({
      success: res.ok,
      status: res.status,
      payload: testPayload,
    });
  } catch (err) {
    log.error('Failed to test webhook', {}, err);
    return NextResponse.json(
      { error: 'Failed to deliver test webhook.' },
      { status: 500 }
    );
  }
}
