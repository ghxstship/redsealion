import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { logAuditAction } from '@/lib/api/audit-logger';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('events', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const url = new URL(request.url);
  const scheduleType = url.searchParams.get('schedule_type');
  const status = url.searchParams.get('status');
  const eventId = url.searchParams.get('event_id');

  let query = supabase
    .from('production_schedules')
    .select('*, events(id, name, slug), schedule_blocks(count), schedule_milestones(count)')
    .eq('organization_id', perm.organizationId)
    .order('start_date', { ascending: true });

  if (scheduleType) query = query.eq('schedule_type', scheduleType);
  if (status) query = query.eq('status', status);
  if (eventId) query = query.eq('event_id', eventId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch schedules', details: error.message }, { status: 500 });

  return NextResponse.json({ schedules: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('events', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { name, schedule_type, event_id, start_date, end_date, timezone, status } = body as Record<string, unknown>;

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const supabase = await createClient();

  const { data: schedule, error } = await supabase
    .from('production_schedules')
    .insert({
      organization_id: perm.organizationId,
      name: name as string,
      schedule_type: (schedule_type as string) ?? 'general',
      event_id: (event_id as string) ?? null,
      start_date: (start_date as string) ?? null,
      end_date: (end_date as string) ?? null,
      timezone: (timezone as string) ?? 'America/New_York',
      status: (status as string) ?? 'draft',
      created_by: perm.userId,
    })
    .select()
    .single();

  if (error || !schedule) return NextResponse.json({ error: 'Failed to create schedule', details: error?.message }, { status: 500 });

  logAuditAction({ orgId: perm.organizationId, action: 'schedule.create', entity: 'production_schedules', entityId: schedule.id, metadata: { name: name as string } }).catch(() => {});

  return NextResponse.json({ success: true, schedule }, { status: 201 });
}
