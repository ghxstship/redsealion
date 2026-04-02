import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireFeature } from '@/lib/api/tier-guard';
import { requirePermission } from '@/lib/api/permission-guard';
import { getAdapter } from '@/lib/integrations/registry';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;

  try {
    const tierError = await requireFeature('integrations');
    if (tierError) return tierError;

    const permError = await requirePermission('integrations', 'edit');
    if (permError) return permError;

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

    // Resolve the adapter for this platform
    const adapter = getAdapter(platform);
    if (!adapter) {
      return NextResponse.json(
        { error: `No adapter found for platform: ${platform}` },
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

    try {
      // Run the adapter's sync method
      const result = await adapter.sync(integration.id, 'inbound');

      // Update sync log with results
      if (syncLog) {
        await supabase
          .from('integration_sync_log')
          .update({
            status: result.errors.length > 0 ? 'completed_with_errors' : 'completed',
            entity_type: result.entityType,
            entity_count: result.entityCount,
            error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
            completed_at: new Date().toISOString(),
          })
          .eq('id', syncLog.id);
      }

      // Update last_sync_at on the integration
      await supabase
        .from('integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integration.id);

      return NextResponse.json({
        success: true,
        platform,
        syncLogId: syncLog?.id,
        entityType: result.entityType,
        entityCount: result.entityCount,
        errors: result.errors,
      });
    } catch (syncError) {
      // Mark sync as failed
      if (syncLog) {
        await supabase
          .from('integration_sync_log')
          .update({
            status: 'failed',
            error_message:
              syncError instanceof Error ? syncError.message : 'Unknown sync error',
            completed_at: new Date().toISOString(),
          })
          .eq('id', syncLog.id);
      }

      console.error(`Sync adapter error [${platform}]:`, syncError);
      return NextResponse.json(
        {
          error: 'Sync failed',
          details: syncError instanceof Error ? syncError.message : 'Unknown error',
          syncLogId: syncLog?.id,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error(`Sync error [${platform}]:`, error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
