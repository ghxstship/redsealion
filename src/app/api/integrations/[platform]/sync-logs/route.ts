import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireFeature } from '@/lib/api/tier-guard';
import { requirePermission } from '@/lib/api/permission-guard';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;

  const tierError = await requireFeature('integrations');
  if (tierError) return tierError;

  const permError = await requirePermission('integrations', 'view');
  if (permError) return permError;

  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();

  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the integration id first to make sure it exists
    const { data: integration } = await supabase
      .from('integrations')
      .select('id')
      .eq('organization_id', ctx.organizationId)
      .eq('platform', platform)
      .single();

    if (!integration) {
      return NextResponse.json({ logs: [] });
    }

    const { data: logs, error } = await supabase
      .from('integration_sync_logs')
      .select('*')
      .eq('integration_id', integration.id)
      .order('started_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ logs: logs || [] });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to fetch sync logs' },
      { status: 500 },
    );
  }
}
