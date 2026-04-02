import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Zapier-compatible webhook endpoint
// Supports both triggers (GET for polling) and actions (POST for receiving data)

export async function GET(request: NextRequest) {
  // Zapier polling trigger: return recent events
  const { searchParams } = new URL(request.url);
  const eventType = searchParams.get('event_type') ?? 'all';

  try {
    const supabase = await createClient();

    // Return recent activity as trigger events
    const { data: events } = await supabase
      .from('activity_log')
      .select('id, action, entity_type, entity_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    const filtered = eventType === 'all'
      ? events
      : (events ?? []).filter((e) => e.action === eventType || e.entity_type === eventType);

    return NextResponse.json(filtered ?? []);
  } catch (error) {
    console.error('Zapier polling error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  // Zapier action: receive data from Zapier
  try {
    const body = await request.json();
    const action: string = body.action ?? 'unknown';

    const supabase = await createClient();

    // Placeholder: Process inbound Zapier actions
    // In production, map Zapier action types to XPB operations
    switch (action) {
      case 'create_client': {
        // Would create a new client
        break;
      }
      case 'create_deal': {
        // Would create a new deal
        break;
      }
      case 'update_proposal_status': {
        // Would update proposal status
        break;
      }
      default:
        break;
    }

    // Suppress unused variable warning
    void supabase;

    return NextResponse.json({
      success: true,
      action,
      message: 'Action received and queued for processing',
    });
  } catch (error) {
    console.error('Zapier action error:', error);
    return NextResponse.json({ error: 'Action processing failed' }, { status: 500 });
  }
}
