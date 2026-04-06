import { NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

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

  return NextResponse.json({ success: true, lead });
}
