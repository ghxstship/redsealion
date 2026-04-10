import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('api-milestone-requirements');

interface RouteContext {
  params: Promise<{ id: string; milestoneId: string; reqId: string }>;
}

/**
 * PATCH /api/proposals/[id]/milestones/[milestoneId]/requirements/[reqId]
 *
 * Allows portal clients to update the status of client-assigned milestone
 * requirements (e.g., approve, mark complete).
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: proposalId, milestoneId, reqId } = await context.params;

  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { status } = body as { status?: string };

    const validStatuses = ['complete', 'in_progress', 'waived'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 },
      );
    }

    // Use service client for cross-table validation
    const serviceClient = await createServiceClient();

    // Verify proposal exists
    const { data: proposal } = await serviceClient
      .from('proposals')
      .select('id, organization_id, client_id')
      .eq('id', proposalId)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found.' }, { status: 404 });
    }

    // Verify the user is associated with this proposal's client
    const { data: contact } = await serviceClient
      .from('client_contacts')
      .select('id')
      .eq('email', user.email ?? '')
      .eq('client_id', proposal.client_id)
      .limit(1)
      .maybeSingle();

    // Also check if user is an org member (admin/manager)
    const { data: membership } = await serviceClient
      .from('organization_memberships')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', proposal.organization_id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (!contact && !membership) {
      return NextResponse.json(
        { error: 'You do not have permission to update this requirement.' },
        { status: 403 },
      );
    }

    // Verify the milestone belongs to the proposal
    const { data: milestone } = await serviceClient
      .from('milestone_gates')
      .select('id, phase_id')
      .eq('id', milestoneId)
      .single();

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found.' }, { status: 404 });
    }

    // Verify the phase belongs to the proposal
    const { data: phase } = await serviceClient
      .from('phases')
      .select('id')
      .eq('id', milestone.phase_id)
      .eq('proposal_id', proposalId)
      .single();

    if (!phase) {
      return NextResponse.json({ error: 'Milestone does not belong to this proposal.' }, { status: 404 });
    }

    // Verify the requirement belongs to the milestone and is client-assignable
    const { data: requirement } = await serviceClient
      .from('milestone_requirements')
      .select('id, assignee, status')
      .eq('id', reqId)
      .eq('milestone_id', milestoneId)
      .single();

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found.' }, { status: 404 });
    }

    // Only clients can update client-assigned requirements; org members can update any
    if (contact && !membership && !['client', 'both'].includes(requirement.assignee)) {
      return NextResponse.json(
        { error: 'This requirement is not assigned to the client.' },
        { status: 403 },
      );
    }

    // Update the requirement
    const updatePayload: Record<string, unknown> = { status };
    if (status === 'complete') {
      updatePayload.completed_at = new Date().toISOString();
      updatePayload.completed_by = user.id;
    }

    const { error: updateError } = await serviceClient
      .from('milestone_requirements')
      .update(updatePayload)
      .eq('id', reqId);

    if (updateError) {
      log.error('Failed to update requirement', { reqId, milestoneId }, updateError);
      return NextResponse.json({ error: 'Failed to update requirement.' }, { status: 500 });
    }

    log.info(`Requirement ${reqId} updated to ${status} by ${user.id}`);

    return NextResponse.json({ success: true, status });
  } catch (err) {
    log.error('Error updating milestone requirement', { proposalId, milestoneId, reqId }, err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
