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
  const today = new Date().toISOString();

  const { data: schedules, error } = await supabase
    .from('maintenance_schedules')
    .select('*')
    .eq('is_active', true)
    .lte('next_due_at', today);

  if (error || !schedules) {
    log.error('Failed to fetch schedules', {}, error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }

  let created = 0;
  for (const schedule of schedules) {
    // Map to the correct columns based on migration 00055 & 00001
    const { error: insertErr } = await supabase
      .from('maintenance_records')
      .insert({
        organization_id: schedule.organization_id,
        asset_id: schedule.asset_id,
        type: schedule.maintenance_type ?? 'inspection',
        description: schedule.description || 'Auto-generated from schedule',
        status: 'scheduled',
        scheduled_date: today.split('T')[0],
      });

    if (insertErr) {
      log.error('Failed to insert maintenance record', { schedule_id: schedule.id }, insertErr);
      continue;
    }

    // Advance next_due_at
    let nextDate: Date | null = null;
    if (schedule.schedule_type === 'time_based' && schedule.interval_days) {
      nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + schedule.interval_days);
    }

    // Default 30 days if couldn't determine next date
    if (!nextDate) {
      nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 30);
    }

    await supabase
      .from('maintenance_schedules')
      .update({ 
        next_due_at: nextDate.toISOString(), 
        last_triggered_at: today 
      })
      .eq('id', schedule.id);

    created++;
  }

  log.info('Maintenance records generated', { created, total: schedules.length });
  return NextResponse.json({ created, total: schedules.length });
}
