import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'No organization' }, { status: 400 });
    }

    // Check integration exists and is connected
    const { data: integration } = await supabase
      .from('integrations')
      .select('id, status')
      .eq('organization_id', userData.organization_id)
      .eq('platform', platform)
      .single();

    if (!integration || integration.status !== 'connected') {
      return NextResponse.json(
        { error: 'Integration not connected' },
        { status: 400 },
      );
    }

    // Create sync log entry
    const { data: syncLog } = await supabase
      .from('integration_sync_log')
      .insert({
        integration_id: integration.id,
        organization_id: userData.organization_id,
        direction: 'bidirectional',
        entity_type: 'all',
        status: 'in_progress',
      })
      .select('id')
      .single();

    // Placeholder: In production, trigger the actual sync via the adapter
    // For now, mark as completed immediately
    if (syncLog) {
      await supabase
        .from('integration_sync_log')
        .update({ status: 'completed', entity_count: 0, completed_at: new Date().toISOString() })
        .eq('id', syncLog.id);
    }

    // Update last_sync_at
    await supabase
      .from('integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integration.id);

    return NextResponse.json({
      success: true,
      platform,
      syncLogId: syncLog?.id,
    });
  } catch (error) {
    console.error(`Sync error [${platform}]:`, error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
