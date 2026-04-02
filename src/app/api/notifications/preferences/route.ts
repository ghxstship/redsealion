import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET() {
  try {
    const permResult = await checkPermission('team', 'view');
    if (!permResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!permResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = permResult;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('id, event_type, channel, enabled')
      .eq('user_id', userId);

    if (error) {
      console.error('[Preferences] Failed to fetch:', error);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 },
      );
    }

    return NextResponse.json({ preferences: data ?? [] });
  } catch (error) {
    console.error('[Preferences] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { preferences } = body as {
      preferences: Array<{
        event_type: string;
        channel: string;
        enabled: boolean;
      }>;
    };

    if (!preferences || !Array.isArray(preferences)) {
      return NextResponse.json(
        { error: 'Missing required field: preferences (array)' },
        { status: 400 },
      );
    }

    // Upsert each preference row
    const rows = preferences.map((p) => ({
      user_id: user.id,
      event_type: p.event_type,
      channel: p.channel,
      enabled: p.enabled,
    }));

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(rows, {
        onConflict: 'user_id,event_type,channel',
      });

    if (error) {
      console.error('[Preferences] Failed to update:', error);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Preferences] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
