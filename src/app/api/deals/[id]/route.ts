import { NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import { dispatchWebhookEvent } from '@/lib/webhooks/outbound';
import { checkAutomationTriggers } from '@/lib/automations/trigger';
import type { DealStage } from '@/types/database';

const VALID_DEAL_TRANSITIONS: Record<string, string[]> = {
  lead: ['qualified', 'lost', 'on_hold'],
  qualified: ['proposal_sent', 'lost', 'on_hold'],
  proposal_sent: ['negotiation', 'lost', 'on_hold'],
  negotiation: ['verbal_yes', 'lost', 'on_hold'],
  verbal_yes: ['contract_signed', 'lost', 'on_hold'],
  contract_signed: [],
  lost: ['lead'],       // can reopen
  on_hold: ['lead', 'qualified', 'proposal_sent', 'negotiation'],
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('pipeline', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { data: deal, error } = await supabase
    .from('deals')
    .select('*, clients(id, company_name), deal_activities(*)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .single();

  if (error || !deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

  return NextResponse.json({ deal });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('pipeline', 'edit');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const {
    title,
    value,
    probability,
    expected_close_date,
    stage,
    notes,
    lost_reason,
    owner_id,
    pipeline_id,
    proposal_id,
  } = body as {
    title?: string;
    value?: number;
    probability?: number;
    expected_close_date?: string | null;
    stage?: string;
    notes?: string | null;
    lost_reason?: string | null;
    owner_id?: string | null;
    pipeline_id?: string | null;
    proposal_id?: string | null;
  };

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Fetch current deal to detect stage changes
  const { data: existingDeal, error: fetchError } = await supabase
    .from('deals')
    .select()
    .eq('id', id)
    .eq('organization_id', orgId)
    .single();

  if (fetchError || !existingDeal) {
    return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
  }

  // Build update payload with only provided fields
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (value !== undefined) updates.deal_value = value;
  if (probability !== undefined) updates.probability = probability;
  if (expected_close_date !== undefined) updates.expected_close_date = expected_close_date;
  if (stage !== undefined && stage !== existingDeal.stage) {
    const currentStage = existingDeal.stage as string;
    const allowedNext = VALID_DEAL_TRANSITIONS[currentStage] || [];
    if (!allowedNext.includes(stage)) {
      return NextResponse.json({ error: `Invalid stage transition from ${currentStage} to ${stage}` }, { status: 400 });
    }
    updates.stage = stage;
    updates.stage_entered_at = new Date().toISOString();
    if (currentStage === 'lost' && stage === 'lead') {
      updates.reopened_at = new Date().toISOString();
      updates.reopen_count = (existingDeal.reopen_count || 0) + 1;
    }
  }
  if (notes !== undefined) updates.notes = notes;
  if (lost_reason !== undefined) updates.lost_reason = lost_reason;
  if (owner_id !== undefined) updates.owner_id = owner_id;
  if (pipeline_id !== undefined) updates.pipeline_id = pipeline_id;
  if (proposal_id !== undefined) updates.proposal_id = proposal_id;

  // Set won/lost dates automatically based on stage
  if (stage === 'contract_signed' && existingDeal.stage !== 'contract_signed') {
    updates.won_date = new Date().toISOString();
  }
  if (stage === 'lost' && existingDeal.stage !== 'lost') {
    updates.lost_date = new Date().toISOString();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'No fields to update.' },
      { status: 400 },
    );
  }

  const { data: deal, error: updateError } = await supabase
    .from('deals')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', orgId)
    .select()
    .single();

  if (updateError || !deal) {
    return NextResponse.json(
      { error: 'Failed to update deal.', details: updateError?.message },
      { status: 500 },
    );
  }

  // Log stage change activity and dispatch webhooks
  if (stage && stage !== existingDeal.stage) {
    await supabase.from('deal_activities').insert({
      deal_id: id,
      organization_id: orgId,
      actor_id: perm.userId,
      type: 'stage_change',
      description: `Stage changed from ${existingDeal.stage} to ${stage}`,
      metadata: {
        old_stage: existingDeal.stage,
        new_stage: stage,
      },
    });

    // Dispatch stage-specific webhooks
    dispatchWebhookEvent(orgId, 'deal.stage_changed', { deal_id: id, old_stage: existingDeal.stage, new_stage: stage }).catch(() => {});

    // Fire automation triggers
    checkAutomationTriggers('deal_stage_change', {
      org_id: orgId,
      deal_id: id,
      deal_title: deal.title,
      old_stage: existingDeal.stage,
      new_stage: stage,
      deal_value: deal.deal_value,
      entity_type: 'deal',
      entity_id: id,
    }).catch(() => {});
    if (stage === 'contract_signed') {
      dispatchWebhookEvent(orgId, 'deal.won', { deal }).catch(() => {});
    }
    if (stage === 'lost') {
      dispatchWebhookEvent(orgId, 'deal.lost', { deal, lost_reason: lost_reason ?? null }).catch(() => {});
    }
  }

  return NextResponse.json({ success: true, deal });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('pipeline', 'delete');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const orgId = perm.organizationId;

  const { error } = await supabase
    .from('deals')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', orgId);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete deal.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
