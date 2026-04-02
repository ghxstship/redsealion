import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireFeature } from '@/lib/api/tier-guard';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;

  try {
    const tierError = await requireFeature('pm_sync');
    if (tierError) return tierError;

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

    const body = await request.json();
    const proposalId: string | undefined = body.proposalId;

    if (!proposalId) {
      return NextResponse.json({ error: 'Proposal ID required' }, { status: 400 });
    }

    // Check integration is connected
    const { data: integration } = await supabase
      .from('integrations')
      .select('id, status')
      .eq('organization_id', userData.organization_id)
      .eq('platform', platform)
      .single();

    if (!integration || integration.status !== 'connected') {
      return NextResponse.json(
        { error: `${platform} integration not connected` },
        { status: 400 },
      );
    }

    // Fetch proposal with phases to create PM project
    const { data: proposal } = await supabase
      .from('proposals')
      .select('id, name, phases(id, name, number)')
      .eq('id', proposalId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Placeholder: In production, create the project in the PM platform
    // Log the sync
    await supabase.from('integration_sync_log').insert({
      integration_id: integration.id,
      organization_id: userData.organization_id,
      direction: 'outbound',
      entity_type: 'project',
      entity_count: 1,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      platform,
      proposalId,
      projectName: proposal.name,
    });
  } catch (error) {
    console.error(`Project create error [${platform}]:`, error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
