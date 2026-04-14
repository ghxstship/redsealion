import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/api/auth-guard';
import { logAudit } from '@/lib/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authMsg = await requireAdmin();
  if (authMsg.denied) return authMsg.denied;
  const perm = { organizationId: authMsg.ctx.organizationId, userId: authMsg.ctx.userId };

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  // Extended field set — includes all HR fields from audit gaps #12 and #13
  const allowedFields = [
    'full_name', 'title', 'role', 'rate_card', 'phone',
    'department', 'employment_type', 'start_date', 'hourly_cost',
    'facility_id', 'avatar_url',
  ];

  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch prior state for audit diff
  const { data: before } = await supabase
    .from('users')
    .select('full_name, role, title, department, employment_type')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (error) {
    return NextResponse.json({ error: 'Failed to update team member', details: error.message }, { status: 500 });
  }

  // Audit log — gap #32
  await logAudit({
    action: 'team.member.updated',
    entityType: 'user',
    entityId: id,
    metadata: {
      changed_fields: Object.keys(updates),
      before: before ?? {},
    },
  }, supabase);

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authMsg = await requireAdmin();
  if (authMsg.denied) return authMsg.denied;
  const perm = { organizationId: authMsg.ctx.organizationId, userId: authMsg.ctx.userId };

  const { id } = await params;

  // Prevent self-deletion
  if (id === perm.userId) {
    return NextResponse.json({ error: 'You cannot remove yourself from the organization.' }, { status: 400 });
  }

  const supabase = await createClient();

  // Soft-deactivate via deleted_at on users table as well
  await supabase
    .from('users')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  // Deactivate membership
  const { error } = await supabase
    .from('organization_memberships')
    .update({ status: 'deactivated' })
    .eq('user_id', id)
    .eq('organization_id', perm.organizationId);

  if (error) {
    return NextResponse.json({ error: 'Failed to remove team member', details: error.message }, { status: 500 });
  }

  // Audit log — gap #32
  await logAudit({
    action: 'team.member.removed',
    entityType: 'user',
    entityId: id,
  }, supabase);

  return NextResponse.json({ success: true });
}
