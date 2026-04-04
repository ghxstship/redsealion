import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createHmac } from 'crypto';
import { checkPermission } from '@/lib/api/permission-guard';

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

async function deliverWebhook(
  endpoint: { id: string; url: string; secret: string },
  event: string,
  payload: Record<string, unknown>,
): Promise<{ status: number; body: string }> {
  const payloadString = JSON.stringify(payload);
  const signature = signPayload(payloadString, endpoint.secret);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event,
        'X-Webhook-Signature': signature,
      },
      body: payloadString,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const body = await response.text().catch(() => '');
    return { status: response.status, body: body.slice(0, 2000) };
  } catch (err) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { status: 0, body: `Delivery failed: ${message}` };
  }
}

export async function POST(request: NextRequest) {
  try {
    const perm = await checkPermission('automations', 'edit');
    if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const event: string = body.event ?? 'unknown';
    const payload: Record<string, unknown> = body.payload ?? {};

    const supabase = await createClient();

    // Find matching webhook endpoints for this event
    const { data: endpoints } = await supabase
      .from('webhook_endpoints')
      .select('id, url, secret, events')
      .eq('is_active', true);

    if (!endpoints || endpoints.length === 0) {
      return NextResponse.json({ received: true, deliveries: 0 });
    }

    // Filter endpoints subscribed to this event
    const matching = endpoints.filter(
      (ep) => ep.events.length === 0 || ep.events.includes(event),
    );

    // Deliver to each matching endpoint
    const deliveryResults: Array<{ endpoint_id: string; status: number; success: boolean }> = [];

    for (const endpoint of matching) {
      const result = await deliverWebhook(endpoint, event, payload);

      // Record delivery in database
      await supabase.from('webhook_deliveries').insert({
        webhook_endpoint_id: endpoint.id,
        event,
        payload,
        response_status: result.status,
        response_body: result.body,
      });

      deliveryResults.push({
        endpoint_id: endpoint.id,
        status: result.status,
        success: result.status >= 200 && result.status < 300,
      });
    }

    return NextResponse.json({
      received: true,
      event,
      deliveries: matching.length,
      results: deliveryResults,
    });
  } catch (error) {
    const { createLogger } = await import('@/lib/logger');
    createLogger('webhooks').error('Webhook receiver error', {}, error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
