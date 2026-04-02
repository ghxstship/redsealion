import { NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

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
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .single();

  if (fetchError || !existingDeal) {
    return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
  }

  // Build update payload with only provided fields
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (value !== undefined) updates.value = value;
  if (probability !== undefined) updates.probability = probability;
  if (expected_close_date !== undefined) updates.expected_close_date = expected_close_date;
  if (stage !== undefined) updates.stage = stage;
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

  // Log stage change activity
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
    .delete()
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
