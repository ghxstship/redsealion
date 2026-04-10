import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const perm = await checkPermission('equipment', 'edit');
  if (!perm || !perm.allowed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { method, reason, proceeds } = body;

  if (!method || !reason) {
    return NextResponse.json({ error: 'Method and reason are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  // Update asset status
  const { data, error } = await supabase
    .from('assets')
    .update({ 
      status: 'disposed',
      disposed_at: now,
      disposal_method: method,
      disposal_reason: reason,
      disposal_proceeds: proceeds || 0,
      retired_at: now
    })
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Failed to dispose asset' }, { status: 500 });
  }

  // Log in asset_audit_log
  await supabase.from('asset_audit_log').insert({
    asset_id: id,
    organization_id: perm.organizationId,
    field_changed: 'status',
    new_value: 'disposed',
    changed_by: perm.userId,
  });

  return NextResponse.json({ success: true, asset: data });
}
