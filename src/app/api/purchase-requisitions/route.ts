import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('warehouse', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  let query = supabase
    .from('purchase_requisitions')
    .select('*, requisition_line_items(count), users!requested_by(full_name)')
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch requisitions', details: error.message }, { status: 500 });

  return NextResponse.json({ requisitions: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('warehouse', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { priority, needed_by, notes } = body as Record<string, unknown>;

  const supabase = await createClient();

  // Generate requisition number
  const { count } = await supabase
    .from('purchase_requisitions')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', perm.organizationId);
  const reqNumber = `REQ-${String((count ?? 0) + 1).padStart(4, '0')}`;

  const { data: requisition, error } = await supabase
    .from('purchase_requisitions')
    .insert({
      organization_id: perm.organizationId,
      requisition_number: reqNumber,
      requested_by: perm.userId,
      priority: (priority as string) ?? 'medium',
      needed_by: (needed_by as string) ?? null,
      notes: (notes as string) ?? null,
    })
    .select()
    .single();

  if (error || !requisition) return NextResponse.json({ error: 'Failed to create requisition', details: error?.message }, { status: 500 });

  return NextResponse.json({ success: true, requisition }, { status: 201 });
}
