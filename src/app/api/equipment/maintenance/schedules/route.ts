import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

/**
 * GET /api/equipment/maintenance/schedules
 * List maintenance schedules, optionally filtered by asset.
 */
export async function GET(request: NextRequest) {
  const perm = await checkPermission('equipment', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const { searchParams } = request.nextUrl;

  let query = supabase
    .from('maintenance_schedules')
    .select('*, asset:assets(id, name, category)')
    .eq('organization_id', perm.organizationId)
    .order('next_due_at', { ascending: true });

  const assetId = searchParams.get('assetId');
  if (assetId) query = query.eq('asset_id', assetId);

  const activeOnly = searchParams.get('active');
  if (activeOnly === 'true') query = query.eq('is_active', true);

  const { data: schedules, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch schedules.', details: error.message }, { status: 500 });
  }

  // Annotate with overdue flag
  const now = new Date().toISOString();
  const annotated = (schedules ?? []).map((s) => ({
    ...s,
    is_overdue: s.is_active && s.next_due_at && s.next_due_at < now,
  }));

  return NextResponse.json({ schedules: annotated });
}

/**
 * POST /api/equipment/maintenance/schedules
 * Create a new maintenance schedule.
 */
export async function POST(request: NextRequest) {
  const perm = await checkPermission('equipment', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const {
    asset_id,
    schedule_type,
    interval_days,
    interval_usage,
    maintenance_type,
    description,
    estimated_duration_hours,
    estimated_cost,
    assigned_to,
  } = body as {
    asset_id?: string;
    schedule_type?: string;
    interval_days?: number;
    interval_usage?: number;
    maintenance_type?: string;
    description?: string;
    estimated_duration_hours?: number;
    estimated_cost?: number;
    assigned_to?: string;
  };

  if (!asset_id) return NextResponse.json({ error: 'asset_id is required.' }, { status: 400 });
  if (!schedule_type) return NextResponse.json({ error: 'schedule_type is required.' }, { status: 400 });
  if (!maintenance_type) return NextResponse.json({ error: 'maintenance_type is required.' }, { status: 400 });

  if (schedule_type === 'time_based' && (!interval_days || interval_days < 1)) {
    return NextResponse.json({ error: 'interval_days must be >= 1 for time-based schedules.' }, { status: 400 });
  }

  if (schedule_type === 'usage_based' && (!interval_usage || interval_usage < 1)) {
    return NextResponse.json({ error: 'interval_usage must be >= 1 for usage-based schedules.' }, { status: 400 });
  }

  // Compute next_due_at for time-based schedules
  let next_due_at: string | null = null;
  if (schedule_type === 'time_based' && interval_days) {
    const due = new Date();
    due.setDate(due.getDate() + interval_days);
    next_due_at = due.toISOString();
  }

  const supabase = await createClient();

  const { data: schedule, error: insertError } = await supabase
    .from('maintenance_schedules')
    .insert({
      asset_id,
      organization_id: perm.organizationId,
      schedule_type,
      interval_days: interval_days ?? null,
      interval_usage: interval_usage ?? null,
      maintenance_type,
      description: description || null,
      estimated_duration_hours: estimated_duration_hours ?? null,
      estimated_cost: estimated_cost ?? null,
      assigned_to: assigned_to || null,
      next_due_at,
    })
    .select()
    .single();

  if (insertError || !schedule) {
    return NextResponse.json({ error: 'Failed to create schedule.', details: insertError?.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, schedule }, { status: 201 });
}
