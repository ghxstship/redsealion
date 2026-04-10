import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('api-notification-preferences');

/**
 * PUT /api/public/notification-preferences
 *
 * Upserts notification preferences for the authenticated portal user.
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { organization_id, event_type, channel, enabled } = body as {
      organization_id: string;
      event_type: string;
      channel: string;
      enabled: boolean;
    };

    if (!organization_id || !event_type || !channel || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'organization_id, event_type, channel, and enabled are required.' },
        { status: 400 },
      );
    }

    const serviceClient = await createServiceClient();

    // Upsert the preference
    const { error } = await serviceClient
      .from('notification_preferences')
      .upsert(
        {
          user_id: user.id,
          organization_id,
          event_type,
          channel,
          enabled,
        },
        { onConflict: 'user_id,organization_id,event_type,channel' },
      );

    if (error) {
      log.error('Failed to upsert notification preference', { userId: user.id }, error);
      return NextResponse.json({ error: 'Failed to update preference.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    log.error('Error in notification-preferences route', {}, err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
