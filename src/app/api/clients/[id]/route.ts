import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { dispatchWebhookEvent } from '@/lib/webhooks/outbound';
import { logAuditAction } from '@/lib/api/audit-logger';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('clients', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from('clients')
    .select('*, client_contacts(*)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .single();

  if (error || !client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  return NextResponse.json({ client });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('clients', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = ['company_name', 'industry', 'billing_address', 'tags', 'source', 'website', 'linkedin', 'notes', 'annual_revenue', 'employee_count', 'status'];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data: client, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !client) return NextResponse.json({ error: 'Failed to update client', details: error?.message }, { status: 500 });

  dispatchWebhookEvent(perm.organizationId, 'client.updated', { client }).catch(() => {});
  logAuditAction({ orgId: perm.organizationId, action: 'client.updated', entity: 'clients', entityId: id, metadata: { updates } }).catch(() => {});

  return NextResponse.json({ success: true, client });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('clients', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from('clients').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('organization_id', perm.organizationId);
  if (error) return NextResponse.json({ error: 'Failed to delete client', details: error.message }, { status: 500 });

  // H-13: Cascade soft-delete to contacts
  await supabase.from('client_contacts').update({ deleted_at: new Date().toISOString() }).eq('client_id', id);

  dispatchWebhookEvent(perm.organizationId, 'client.deleted', { id }).catch(() => {});
  logAuditAction({ orgId: perm.organizationId, action: 'client.deleted', entity: 'clients', entityId: id }).catch(() => {});

  return NextResponse.json({ success: true });
}
