import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireFeature } from '@/lib/api/tier-guard';
import { requirePermission } from '@/lib/api/permission-guard';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

import { createLogger } from '@/lib/logger';

const log = createLogger('integrations');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;

  try {
    const tierError = await requireFeature('pm_sync');
    if (tierError) return tierError;

    const permError = await requirePermission('integrations', 'edit');
    if (permError) return permError;

    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = ctx.organizationId;

    const body = await request.json();
    const proposalId: string | undefined = body.proposalId;

    if (!proposalId) {
      return NextResponse.json({ error: 'Proposal ID required' }, { status: 400 });
    }

    // Check integration is connected
    const { data: integration } = await supabase
      .from('integrations')
      .select('id, status, config')
      .eq('organization_id', orgId)
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
      .select('id, name, phases(id, name, number, duration_days)')
      .eq('id', proposalId)
      .eq('organization_id', orgId)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Formulate the standardized JSON payload for external PM synchronization
    const outboundProjectPayload = {
      project_name: proposal.name,
      external_reference: proposal.id,
      timeline_phases: (proposal.phases ?? []).map(p => ({
        phase_name: p.name,
        phase_number: p.number,
        duration: p.duration_days ?? 0
      }))
    };

    let pushStatus = 'completed';

    // Simulated Abstracted Push Mechanism
    try {
      const integrationApiUrl = (integration.config as Record<string, string>)?.api_url;
      if (integrationApiUrl) {
         await fetch(integrationApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(outboundProjectPayload),
         });
      }
    } catch (pushError) {
      // Degrade gracefully 
      log.warn(`Failed to push to external ${platform} PM API`, { outboundProjectPayload, error: String(pushError) });
      pushStatus = 'failed';
    }

    // Log the sync
    await supabase.from('integration_sync_logs').insert({
      integration_id: integration.id,
      organization_id: orgId,
      direction: 'outbound',
      entity_type: 'project',
      entity_count: 1,
      status: pushStatus,
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: pushStatus === 'completed',
      platform,
      proposalId,
      projectName: proposal.name,
      status: pushStatus
    });
  } catch (error) {
    log.error(`Project create error [${platform}]:`, {}, error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
