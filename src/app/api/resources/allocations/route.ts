import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { logAuditAction } from '@/lib/api/audit-logger';

export async function GET() {
  const perm = await checkPermission('resources', 'view', 'resource_scheduling');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();

  const { data: allocations, error } = await supabase
    .from('resource_allocations')
    .select('*, users!user_id(full_name), proposals(name)')
    .eq('organization_id', perm.organizationId)
    .order('start_date');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: allocations ?? [] });
}

export async function POST(request: Request) {
  const perm = await checkPermission('resources', 'create', 'resource_scheduling');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();

  if (!body.user_id || !body.start_date || !body.end_date) {
    return NextResponse.json(
      { error: 'user_id, start_date, and end_date are required' },
      { status: 400 },
    );
  }

  if (new Date(body.end_date) < new Date(body.start_date)) {
    return NextResponse.json(
      { error: 'end_date must be after start_date' },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: allocation, error } = await supabase
    .from('resource_allocations')
    .insert({
      organization_id: perm.organizationId,
      user_id: body.user_id,
      proposal_id: body.proposal_id || null,
      start_date: body.start_date,
      end_date: body.end_date,
      hours_per_day: body.hours_per_day ?? 8,
      role: body.role || null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logAuditAction({ orgId: perm.organizationId, action: 'allocation.create', entity: 'resource_allocations', entityId: allocation.id, metadata: { user_id: body.user_id } }).catch(() => {});

  return NextResponse.json({ data: allocation }, { status: 201 });
}
