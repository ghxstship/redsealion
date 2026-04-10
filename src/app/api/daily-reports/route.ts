import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('events', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const url = new URL(request.url);
  const eventId = url.searchParams.get('event_id');

  let query = supabase
    .from('daily_reports')
    .select('*, events(name), users!daily_reports_filed_by_fkey(full_name)')
    .eq('organization_id', perm.organizationId)
    .order('report_date', { ascending: false });

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  const { data: reports, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch reports', details: error.message }, { status: 500 });

  return NextResponse.json({ reports: reports ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('events', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { event_id, report_date, labor_hours, crew_count, deliveries_received, notes, status } = body as Record<string, unknown>;

  if (!event_id || !report_date) {
    return NextResponse.json({ error: 'event_id and report_date are required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: report, error } = await supabase
    .from('daily_reports')
    .insert({
      organization_id: perm.organizationId,
      event_id: event_id as string,
      report_date: report_date as string,
      labor_hours: (labor_hours as number) ?? 0,
      crew_count: (crew_count as number) ?? 0,
      deliveries_received: (deliveries_received as number) ?? 0,
      notes: (notes as string) ?? null,
      status: (status as string) ?? 'draft',
      filed_by: perm.userId,
    })
    .select()
    .single();

  if (error || !report) {
    return NextResponse.json({ error: 'Failed to create report', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, report }, { status: 201 });
}
