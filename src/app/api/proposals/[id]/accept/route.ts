import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePortalPermission } from '@/lib/api/portal-guard';
import { dispatchWebhookEvent } from '@/lib/webhooks/outbound';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const permError = await requirePortalPermission('proposals.approve');
    if (permError) return permError;

    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const { signature_data, signer_name, signer_title, selectedAddonIds } = body as {
      signature_data?: string;
      signer_name?: string;
      signer_title?: string;
      selectedAddonIds?: string[];
    };

    if (!signature_data) {
      return NextResponse.json(
        { success: false, error: 'Signature data is required.' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Verify proposal exists and is in a sendable state
    const { data: proposal, error: fetchError } = await supabase
      .from('proposals')
      .select('id, status, organization_id')
      .eq('id', id)
      .single();

    if (fetchError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    if (proposal.status !== 'sent' && proposal.status !== 'viewed' && proposal.status !== 'negotiating') {
      return NextResponse.json(
        { error: `Cannot accept a proposal with status "${proposal.status}"` },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    // Update proposal to approved
    const { error: updateError } = await supabase
      .from('proposals')
      .update({
        status: 'approved',
      })
      .eq('id', id);
    
    // Save selected addons
    if (selectedAddonIds && selectedAddonIds.length >= 0) {
      // First deselect all addons for this proposal
      // To do this we must first find all phases for this proposal
      const { data: phases } = await supabase.from('phases').select('id').eq('proposal_id', id);
      if (phases && phases.length > 0) {
        const phaseIds = phases.map(p => p.id);
        await supabase.from('phase_addons').update({ selected: false }).in('phase_id', phaseIds);
        
        // Then select the chosen ones
        if (selectedAddonIds.length > 0) {
          await supabase.from('phase_addons').update({ selected: true }).in('id', selectedAddonIds);
        }
      }
    }

    if (updateError) {
      const { createLogger } = await import('@/lib/logger');
      createLogger('proposals').error('Failed to accept proposal', { proposalId: id }, updateError);
      return NextResponse.json(
        { error: 'Failed to accept proposal' },
        { status: 500 },
      );
    }

    // Dispatch webhook for approved proposal
    dispatchWebhookEvent(proposal.organization_id, 'proposal.approved', { proposal_id: id }).catch(() => {});

    return NextResponse.json({
      success: true,
      proposal_id: id,
      accepted_at: now,
      signer_name: signer_name ?? null,
      signer_title: signer_title ?? null,
    });
  } catch (error) {
    const { createLogger } = await import('@/lib/logger');
    createLogger('proposals').error('Unexpected error accepting proposal', {}, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
