import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('automations', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { data: automation, error } = await supabase
    .from('automations')
    .select('*, automation_runs(*)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .single();

  if (error || !automation) return NextResponse.json({ error: 'Automation not found' }, { status: 404 });

  return NextResponse.json({ automation });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('automations', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = ['name', 'description', 'trigger_type', 'trigger_config', 'action_type', 'action_config', 'is_active'];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  // Increment version on config changes
  const configChanged = ['trigger_type', 'trigger_config', 'action_type', 'action_config'].some((f) => f in updates);

  const { data: existing } = await supabase
    .from('automations')
    .select('version')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .single();

  if (!existing) return NextResponse.json({ error: 'Automation not found' }, { status: 404 });

  if (configChanged) {
    updates.version = ((existing.version as number) ?? 1) + 1;
  }

  const { data: automation, error } = await supabase
    .from('automations')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !automation) return NextResponse.json({ error: 'Failed to update', details: error?.message }, { status: 500 });

  // Audit log
  await supabase.from('audit_log').insert({
    organization_id: perm.organizationId,
    actor_id: perm.userId,
    entity_type: 'automation',
    entity_id: id,
    action: 'updated',
    details: { fields_changed: Object.keys(updates) },
  }).then(() => {}, () => {});

  return NextResponse.json({ success: true, automation });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('automations', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  // Soft delete — set deleted_at and deactivate
  const { error } = await supabase
    .from('automations')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (error) return NextResponse.json({ error: 'Failed to delete', details: error.message }, { status: 500 });

  // Audit log
  await supabase.from('audit_log').insert({
    organization_id: perm.organizationId,
    actor_id: perm.userId,
    entity_type: 'automation',
    entity_id: id,
    action: 'deleted',
    details: {},
  }).then(() => {}, () => {});

  return NextResponse.json({ success: true });
}
