import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('proposals', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { data: proposal, error } = await supabase
    .from('proposals')
    .select(`
      *,
      phases(*, phase_deliverables(*), phase_addons(*), milestone_gates(*, milestone_requirements(*))),
      venues(*),
      team_assignments(*, users(id, full_name, avatar_url))
    `)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  return NextResponse.json({ proposal });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('proposals', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = [
    'name', 'subtitle', 'status', 'probability', 'currency',
    'total_value', 'total_with_addons', 'narrative_context', 'payment_terms',
    'assumptions', 'tags', 'valid_until',
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data: proposal, error } = await supabase
    .from('proposals')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !proposal) {
    return NextResponse.json({ error: 'Failed to update proposal', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, proposal });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('proposals', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('proposals')
    .delete()
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete proposal', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
