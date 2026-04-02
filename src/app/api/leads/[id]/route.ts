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
  const body = await request.json().catch(() => ({}));
  const { status, assigned_to, converted_to_deal_id } = body as {
    status?: string;
    assigned_to?: string;
    converted_to_deal_id?: string;
  };

  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates.status = status;
  if (assigned_to !== undefined) updates.assigned_to = assigned_to;
  if (converted_to_deal_id !== undefined) updates.converted_to_deal_id = converted_to_deal_id;

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
