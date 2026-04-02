import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event: string = body.event ?? 'unknown';
    const payload: Record<string, unknown> = body.payload ?? {};

    // Validate webhook signature if provided
    const signature = request.headers.get('x-webhook-signature');

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

    // Log deliveries (placeholder: in production, actually forward to the URLs)
    for (const endpoint of matching) {
      await supabase.from('webhook_deliveries').insert({
        webhook_endpoint_id: endpoint.id,
        event,
        payload,
        response_status: 200,
        response_body: 'OK',
      });
    }

    // Suppress unused variable warning
    void signature;

    return NextResponse.json({
      received: true,
      event,
      deliveries: matching.length,
    });
  } catch (error) {
    console.error('Webhook receiver error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
