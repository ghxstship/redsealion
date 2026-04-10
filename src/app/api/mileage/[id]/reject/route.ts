import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { logAuditAction } from '@/lib/api/audit-logger';

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('expenses', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { reason } = body as { reason?: string };

  const supabase = await createClient();

  // Verify mileage exists and is pending
  const { data: mileage, error: fetchErr } = await supabase
    .from('mileage_entries')
    .select('id, status, organization_id')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .single();

  if (fetchErr || !mileage) {
    return NextResponse.json({ error: 'Mileage entry not found' }, { status: 404 });
  }

  if (mileage.status !== 'pending') {
    return NextResponse.json({ error: `Cannot reject mileage entry with status '${mileage.status}'` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('mileage_entries')
    .update({
      status: 'rejected',
      approved_by: perm.userId,
      approved_at: new Date().toISOString(),
      rejection_reason: reason || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to reject mileage', details: error?.message }, { status: 500 });
  }

  logAuditAction({
    orgId: perm.organizationId,
    action: 'mileage.rejected',
    entity: 'mileage_entries',
    entityId: id,
    metadata: { reason: reason || null },
  }).catch(() => {});

  return NextResponse.json({ success: true, mileage: data });
}
