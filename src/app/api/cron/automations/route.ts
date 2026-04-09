import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('cron:automations');

/**
 * POST /api/cron/automations
 * Polls for due scheduled automations and executes them.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const now = new Date().toISOString();

  const { data: automations, error } = await supabase
    .from('automations')
    .select('*')
    .eq('is_active', true)
    .eq('trigger_type', 'schedule')
    .lte('next_run_at', now);

  if (error || !automations) {
    log.error('Failed to fetch automations', {}, error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }

  let executed = 0;
  for (const automation of automations) {
    // Log the run
    const { error: runErr } = await supabase.from('automation_runs').insert({
      automation_id: automation.id,
      organization_id: automation.organization_id,
      status: 'completed',
      started_at: now,
      completed_at: now,
      trigger_data: { trigger: 'cron' },
    });

    if (runErr) continue;

    // Advance next_run_at
    const interval = automation.schedule_interval_minutes ?? 60;
    const nextRun = new Date(Date.now() + interval * 60000).toISOString();

    await supabase
      .from('automations')
      .update({ next_run_at: nextRun, last_run_at: now })
      .eq('id', automation.id);

    executed++;
  }

  log.info('Automations executed', { executed, total: automations.length });
  return NextResponse.json({ executed, total: automations.length });
}
