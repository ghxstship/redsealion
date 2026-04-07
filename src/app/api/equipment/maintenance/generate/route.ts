import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

/**
 * POST /api/equipment/maintenance/generate
 * Auto-generate maintenance records from due schedules.
 * Designed to be called by a cron job or manually.
 */
export async function POST() {
  const perm = await checkPermission('equipment', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const now = new Date().toISOString();

  // Find all active, overdue time-based schedules
  const { data: dueSchedules, error } = await supabase
    .from('maintenance_schedules')
    .select('*, asset:assets(id, name)')
    .eq('organization_id', perm.organizationId)
    .eq('is_active', true)
    .eq('schedule_type', 'time_based')
    .lte('next_due_at', now);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch due schedules.', details: error.message }, { status: 500 });
  }

  if (!dueSchedules || dueSchedules.length === 0) {
    return NextResponse.json({ message: 'No schedules are due.', generated: 0 });
  }

  let generated = 0;

  for (const schedule of dueSchedules) {
    // Create the maintenance record
    const { error: insertError } = await supabase
      .from('maintenance_records')
      .insert({
        organization_id: perm.organizationId,
        asset_id: schedule.asset_id,
        type: schedule.maintenance_type,
        description: schedule.description || `Scheduled ${schedule.maintenance_type} maintenance`,
        scheduled_date: now.split('T')[0],
        status: 'scheduled',
        cost: schedule.estimated_cost ?? null,
        notes: `Auto-generated from schedule ${schedule.id}`,
      });

    if (insertError) continue;

    // Advance the next_due_at
    const nextDue = new Date(schedule.next_due_at!);
    nextDue.setDate(nextDue.getDate() + (schedule.interval_days ?? 30));

    await supabase
      .from('maintenance_schedules')
      .update({
        last_triggered_at: now,
        next_due_at: nextDue.toISOString(),
        updated_at: now,
      })
      .eq('id', schedule.id);

    generated++;
  }

  return NextResponse.json({ success: true, generated, checked: dueSchedules.length });
}
