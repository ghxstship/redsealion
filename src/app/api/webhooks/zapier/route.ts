import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ZAPIER_SECRET = process.env.ZAPIER_WEBHOOK_SECRET;

function validateSecret(request: NextRequest): boolean {
  if (!ZAPIER_SECRET) {
    // No secret configured -- allow all requests in development
    return true;
  }

  // Check header first, then query param
  const headerSecret = request.headers.get('x-zapier-secret');
  if (headerSecret === ZAPIER_SECRET) return true;

  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get('secret');
  if (querySecret === ZAPIER_SECRET) return true;

  return false;
}

// Zapier polling trigger: return recent events
export async function GET(request: NextRequest) {
  if (!validateSecret(request)) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventType = searchParams.get('event_type') ?? 'all';

  try {
    const supabase = await createClient();

    const { data: events } = await supabase
      .from('activity_log')
      .select('id, action, entity_type, entity_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    const filtered =
      eventType === 'all'
        ? events
        : (events ?? []).filter(
            (e) => e.action === eventType || e.entity_type === eventType,
          );

    return NextResponse.json(filtered ?? []);
  } catch (error) {
    console.error('Zapier polling error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

// Zapier action: receive data from Zapier and forward to main webhook handler
export async function POST(request: NextRequest) {
  if (!validateSecret(request)) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  try {

    const body = await request.json();

    // Extract event info from Zapier payload
    const event: string = body.event ?? body.action ?? 'zapier.inbound';
    const payload: Record<string, unknown> = body.payload ?? body.data ?? body;

    // Forward to the main webhook handler internally
    const supabase = await createClient();

    // Find matching webhook endpoints for this event
    const { data: endpoints } = await supabase
      .from('webhook_endpoints')
      .select('id, url, secret, events')
      .eq('is_active', true);

    const matching = (endpoints ?? []).filter(
      (ep) => ep.events.length === 0 || ep.events.includes(event),
    );

    // Record deliveries for audit trail
    for (const endpoint of matching) {
      await supabase.from('webhook_deliveries').insert({
        webhook_endpoint_id: endpoint.id,
        event,
        payload,
        response_status: 200,
        response_body: 'Forwarded from Zapier',
      });
    }

    // Also log to activity_log for polling triggers
    await supabase.from('activity_log').insert({
      action: event,
      entity_type: 'zapier',
      entity_id: null,
      metadata: { source: 'zapier', payload },
    });

    return NextResponse.json({
      success: true,
      event,
      message: 'Event received and processed',
      endpoints_matched: matching.length,
    });
  } catch (error) {
    console.error('Zapier action error:', error);
    return NextResponse.json({ error: 'Action processing failed' }, { status: 500 });
  }
}
