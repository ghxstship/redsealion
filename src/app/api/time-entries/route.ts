import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function POST(request: NextRequest) {
  const perm = await checkPermission('time_tracking', 'create');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    proposal_id,
    task_id,
    description,
    start_time,
    end_time,
    duration_minutes,
    billable,
  } = body as {
    proposal_id?: string;
    task_id?: string;
    description?: string;
    start_time?: string;
    end_time?: string;
    duration_minutes?: number;
    billable?: boolean;
  };

  if (!start_time) {
    return NextResponse.json(
      { error: 'start_time is required.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: entry, error } = await supabase
    .from('time_entries')
    .insert({
      organization_id: perm.organizationId,
      user_id: perm.userId,
      proposal_id: proposal_id || null,
      phase_id: task_id || null,
      description: description || null,
      start_time,
      end_time: end_time || null,
      duration_minutes: duration_minutes ?? null,
      billable: billable ?? true,
    })
    .select()
    .single();

  if (error || !entry) {
    return NextResponse.json(
      { error: 'Failed to create time entry.', details: error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, entry });
}

export async function GET(request: NextRequest) {
  const perm = await checkPermission('time_tracking', 'view');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  const supabase = await createClient();

  let query = supabase
    .from('time_entries')
    .select()
    .eq('user_id', perm.userId)
    .order('start_time', { ascending: false })
    .limit(200);

  if (from) {
    query = query.gte('start_time', from);
  }
  if (to) {
    query = query.lte('start_time', to);
  }

  const { data: entries, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch time entries.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ entries: entries ?? [] });
}
