import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { logAuditAction } from '@/lib/api/audit-logger';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('events', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  // Verify schedule belongs to org
  const { data: schedule } = await supabase
    .from('production_schedules')
    .select('id')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });

  const { data: milestones, error } = await supabase
    .from('schedule_milestones')
    .select('*')
    .eq('schedule_id', id)
    .order('due_at', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 });
  return NextResponse.json({ milestones: milestones ?? [] });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('events', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { title, due_at, status } = body;

  if (!title || !due_at) return NextResponse.json({ error: 'title and due_at are required' }, { status: 400 });

  const supabase = await createClient();

  // Verify schedule belongs to org
  const { data: schedule } = await supabase
    .from('production_schedules')
    .select('id')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });

  const { data: milestone, error } = await supabase
    .from('schedule_milestones')
    .insert({
      schedule_id: id,
      title: title as string,
      due_at: new Date(due_at as string).toISOString(),
      status: (status as string) ?? 'pending',
    })
    .select()
    .single();

  if (error || !milestone) return NextResponse.json({ error: 'Failed to create milestone', details: error?.message }, { status: 500 });

  logAuditAction({
    orgId: perm.organizationId,
    action: 'milestone.created',
    entity: 'schedule_milestones',
    entityId: milestone.id,
    metadata: { schedule_id: id, title: title as string },
  }).catch(() => {});

  return NextResponse.json({ success: true, milestone }, { status: 201 });
}
