import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('settings', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { full_name, title, role, rate_card } = body as {
    full_name?: string;
    title?: string | null;
    role?: string;
    rate_card?: string | null;
  };

  const supabase = await createClient();
  const updates: Record<string, unknown> = {};
  if (full_name !== undefined) updates.full_name = full_name;
  if (title !== undefined) updates.title = title;
  if (role !== undefined) updates.role = role;
  if (rate_card !== undefined) updates.rate_card = rate_card;

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (error) {
    return NextResponse.json({ error: 'Failed to update team member', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('settings', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  // Prevent self-deletion
  if (id === perm.userId) {
    return NextResponse.json({ error: 'You cannot remove yourself from the organization.' }, { status: 400 });
  }

  const supabase = await createClient();

  // Deactivate membership rather than hard-delete for audit trail
  const { error } = await supabase
    .from('organization_memberships')
    .update({ status: 'deactivated' })
    .eq('user_id', id)
    .eq('organization_id', perm.organizationId);

  if (error) {
    return NextResponse.json({ error: 'Failed to remove team member', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
