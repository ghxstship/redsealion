import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('cron:maintenance');

/**
 * POST /api/cron/maintenance
 * Generates maintenance_records from maintenance_schedules that are due.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: schedules, error } = await supabase
    .from('maintenance_schedules')
    .select('*')
    .eq('is_active', true)
    .lte('next_due_date', today);

  if (error || !schedules) {
    log.error('Failed to fetch schedules', {}, error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }

  let created = 0;
  for (const schedule of schedules) {
    const { error: insertErr } = await supabase
      .from('maintenance_records')
      .insert({
        organization_id: schedule.organization_id,
        equipment_id: schedule.equipment_id,
        schedule_id: schedule.id,
        type: schedule.type ?? 'scheduled',
        title: schedule.title ?? 'Scheduled maintenance',
        description: schedule.description,
        status: 'pending',
        scheduled_date: today,
      });

    if (insertErr) continue;

    // Advance next_due_date
    const nextDate = new Date(schedule.next_due_date);
    const interval = schedule.interval_value ?? 30;
    const unit = schedule.interval_unit ?? 'days';
    if (unit === 'days') nextDate.setDate(nextDate.getDate() + interval);
    else if (unit === 'weeks') nextDate.setDate(nextDate.getDate() + interval * 7);
    else if (unit === 'months') nextDate.setMonth(nextDate.getMonth() + interval);

    await supabase
      .from('maintenance_schedules')
      .update({ next_due_date: nextDate.toISOString().split('T')[0], last_performed: today })
      .eq('id', schedule.id);

    created++;
  }

  log.info('Maintenance records generated', { created, total: schedules.length });
  return NextResponse.json({ created, total: schedules.length });
}
