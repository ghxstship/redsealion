import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  const { contactId } = await params;
  const perm = await checkPermission('clients', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = ['first_name', 'last_name', 'email', 'phone', 'title', 'role', 'is_decision_maker', 'is_signatory'];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data: contact, error } = await supabase
    .from('client_contacts')
    .update(updates)
    .eq('organization_id', perm!.organizationId)
    .eq('id', contactId)
    .select()
    .single();

  if (error || !contact) {
    return NextResponse.json({ error: 'Failed to update contact', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, contact });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  const { contactId } = await params;
  const perm = await checkPermission('clients', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();

  const { error } = await supabase
    .from('client_contacts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('organization_id', perm!.organizationId)
    .eq('id', contactId);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete contact', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
