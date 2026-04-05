import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('work_orders', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  const supabase = await createClient();
  let query = supabase
    .from('work_orders')
    .select('*, work_order_assignments(*, crew_profiles(id, full_name))')
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch work orders.', details: error.message }, { status: 500 });

  return NextResponse.json({ work_orders: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('work_orders', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { title, description, proposal_id, task_id, priority, location_name, location_address, scheduled_start, scheduled_end, crew_ids, checklist } = body;

  if (!title) return NextResponse.json({ error: 'title is required.' }, { status: 400 });

  const supabase = await createClient();

  // Generate WO number
  const { count } = await supabase
    .from('work_orders')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', perm.organizationId);
  const woNumber = `WO-${String((count ?? 0) + 1).padStart(4, '0')}`;

  const { data: wo, error } = await supabase
    .from('work_orders')
    .insert({
      organization_id: perm.organizationId,
      proposal_id: proposal_id || null,
      task_id: task_id || null,
      wo_number: woNumber,
      title,
      description: description || null,
      priority: priority || 'medium',
      location_name: location_name || null,
      location_address: location_address || null,
      scheduled_start: scheduled_start || null,
      scheduled_end: scheduled_end || null,
      checklist: checklist || [],
      dispatched_by: perm.userId,
    })
    .select()
    .single();

  if (error || !wo) return NextResponse.json({ error: 'Failed to create work order.', details: error?.message }, { status: 500 });

  // Create crew assignments if provided
  if (Array.isArray(crew_ids) && crew_ids.length > 0) {
    const assignments = crew_ids.map((crewId: string) => ({
      work_order_id: wo.id,
      crew_profile_id: crewId,
    }));
    await supabase.from('work_order_assignments').insert(assignments);
  }

  return NextResponse.json({ success: true, work_order: wo });
}
