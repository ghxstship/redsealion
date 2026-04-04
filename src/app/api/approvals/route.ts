import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { buildApprovalInsert, getPostApprovalStatus, getEntityTable } from '@/lib/approvals';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('tasks', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status') ?? 'pending';

  const { data, error } = await supabase
    .from('approval_requests')
    .select('*')
    .eq('organization_id', perm.organizationId)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch approvals.', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ approvals: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('tasks', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { entity_type, entity_id, entity_title, approver_ids } = body as {
    entity_type?: string;
    entity_id?: string;
    entity_title?: string;
    approver_ids?: string[];
  };

  if (!entity_type || !entity_id || !approver_ids?.length) {
    return NextResponse.json({ error: 'entity_type, entity_id, and approver_ids are required.' }, { status: 400 });
  }

  const supabase = await createClient();
  const insert = buildApprovalInsert({
    orgId: perm.organizationId,
    entityType: entity_type as Parameters<typeof buildApprovalInsert>[0]['entityType'],
    entityId: entity_id,
    entityTitle: entity_title ?? '',
    requestedBy: perm.userId,
    approverIds: approver_ids,
  });

  const { data, error } = await supabase
    .from('approval_requests')
    .insert(insert)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to create approval request.', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ approval: data });
}

export async function PATCH(request: NextRequest) {
  const perm = await checkPermission('tasks', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { approval_id, decision, rejection_reason } = body as {
    approval_id?: string;
    decision?: 'approved' | 'rejected';
    rejection_reason?: string;
  };

  if (!approval_id || !decision) {
    return NextResponse.json({ error: 'approval_id and decision are required.' }, { status: 400 });
  }

  const supabase = await createClient();

  // Update the approval request
  const updateData: Record<string, unknown> = {
    status: decision,
    [`${decision === 'approved' ? 'approved' : 'rejected'}_by`]: perm.userId,
    [`${decision === 'approved' ? 'approved' : 'rejected'}_at`]: new Date().toISOString(),
  };

  if (decision === 'rejected' && rejection_reason) {
    updateData.rejection_reason = rejection_reason;
  }

  const { data: approval, error: updateError } = await supabase
    .from('approval_requests')
    .update(updateData)
    .eq('id', approval_id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (updateError || !approval) {
    return NextResponse.json({ error: 'Failed to update approval.', details: updateError?.message }, { status: 500 });
  }

  // Update the entity status
  const entityType = approval.entity_type as string;
  const entityId = approval.entity_id as string;
  const newStatus = getPostApprovalStatus(
    entityType as Parameters<typeof getPostApprovalStatus>[0],
    decision,
  );
  const table = getEntityTable(entityType as Parameters<typeof getEntityTable>[0]);

  try {
    await supabase
      .from(table)
      .update({ status: newStatus })
      .eq('id', entityId);
  } catch {
    // Entity status update failure doesn't block approval
  }

  return NextResponse.json({ approval });
}
