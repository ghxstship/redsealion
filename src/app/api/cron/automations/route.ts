import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { executeAction } from '@/lib/automations/actions';

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
    .is('deleted_at', null)
    .lte('next_run_at', now);

  if (error || !automations) {
    log.error('Failed to fetch automations', {}, error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }

  let executed = 0;
  let failed = 0;

  for (const automation of automations) {
    // Create run record
    const { data: run } = await supabase.from('automation_runs').insert({
      automation_id: automation.id,
      organization_id: automation.organization_id,
      status: 'running',
      started_at: now,
      trigger_data: { trigger: 'cron', schedule: automation.trigger_config },
    }).select('id').single();

    // Execute the configured action
    const actionConfig = (automation.action_config ?? {}) as Record<string, unknown>;
    const payload = {
      org_id: automation.organization_id as string,
      trigger: 'cron',
      automation_name: automation.name,
    };

    try {
      await executeAction(
        automation.action_type as string,
        actionConfig,
        payload,
        automation.id as string,
      );

      // Mark run as completed
      if (run) {
        await supabase.from('automation_runs').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result: { success: true },
        }).eq('id', run.id);
      }

      executed++;
    } catch (err) {
      // Mark run as failed
      if (run) {
        await supabase.from('automation_runs').update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error: err instanceof Error ? err.message : 'Unknown error',
        }).eq('id', run.id);
      }
      failed++;
    }

    // Advance next_run_at
    const interval = (automation.schedule_interval_minutes as number) ?? 60;
    const nextRun = new Date(Date.now() + interval * 60000).toISOString();

    await supabase
      .from('automations')
      .update({
        next_run_at: nextRun,
        last_run_at: now,
        run_count: ((automation.run_count as number) ?? 0) + 1,
      })
      .eq('id', automation.id);
  }

  log.info('Automations executed', { executed, failed, total: automations.length });
  return NextResponse.json({ executed, failed, total: automations.length });
}
