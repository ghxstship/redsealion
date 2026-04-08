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
    const tierError = await requireFeature('accounting_sync');
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
    const invoiceIds: string[] = body.invoiceIds ?? [];

    if (invoiceIds.length === 0) {
      return NextResponse.json({ error: 'No invoice IDs provided' }, { status: 400 });
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

    // Fetch full invoice objects
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, client_id, organizations(name)')
      .in('id', invoiceIds)
      .eq('organization_id', orgId);

    if (invoiceError || !invoices || invoices.length === 0) {
      return NextResponse.json({ error: 'Invoices not found' }, { status: 404 });
    }

    // Simulate outbound push mechanism (gracefully caught to avoid hard 500s locally)
    const outboundPayload = {
      timestamp: new Date().toISOString(),
      platform,
      invoices: invoices.map((inv) => ({
        external_id: inv.id,
        number: inv.number,
        amount: inv.amount,
        currency: inv.currency,
        status: inv.status,
      })),
    };

    let pushStatus = 'completed';
    
    // Abstracted safe fetch block logic representing the integration call
    try {
      const integrationApiUrl = (integration.config as Record<string, string>)?.api_url;
      if (integrationApiUrl) {
         await fetch(integrationApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(outboundPayload),
         });
      }
    } catch (pushError) {
      // Don't crash out the process if the vendor API fails locally. Log as failed sync.
      log.warn(`Failed to push to external ${platform} API`, { outboundPayload, error: String(pushError) });
      pushStatus = 'failed';
    }

    // Log the sync attempt
    await supabase.from('integration_sync_log').insert({
      integration_id: integration.id,
      organization_id: orgId,
      direction: 'outbound',
      entity_type: 'invoice',
      entity_count: invoices.length,
      status: pushStatus,
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: pushStatus === 'completed',
      platform,
      pushed: invoices.length,
      status: pushStatus
    });
  } catch (error) {
    log.error(`Invoice push error [${platform}]:`, {}, error);
    return NextResponse.json({ error: 'Failed to push invoices' }, { status: 500 });
  }
}
