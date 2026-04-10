import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import { dispatchWebhookEvent } from '@/lib/webhooks/outbound';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('leads', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { data: lead, error } = await supabase
    .from('leads')
    .select()
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .single();

  if (error || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  return NextResponse.json({ lead });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('leads', 'edit');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  const allowedFields = [
    'contact_first_name', 'contact_last_name', 'contact_email', 'contact_phone',
    'company_name', 'source', 'event_type', 'event_date', 'estimated_budget',
    'message', 'status', 'assigned_to', 'converted_to_deal_id',
    'converted_to_client_id', 'converted_to_contact_id', 'lost_reason',
  ];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'No fields to update.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  const { data: lead, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', orgId)
    .select()
    .single();

  if (error || !lead) {
    return NextResponse.json(
      { error: 'Failed to update lead.', details: error?.message },
      { status: 500 },
    );
  }

  // Dispatch webhook if lead was just converted
  if (updates.converted_to_deal_id) {
    dispatchWebhookEvent(orgId, 'lead.converted', { lead_id: id, deal_id: updates.converted_to_deal_id }).catch(() => {});
  }

  return NextResponse.json({ success: true, lead });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('leads', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from('leads').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('organization_id', perm.organizationId);
  if (error) return NextResponse.json({ error: 'Failed to delete lead', details: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
