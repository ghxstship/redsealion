import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('cron-proposal-follow-ups');

/**
 * Cron job: evaluate proposal follow-up automations.
 *
 * For every active automation with trigger_type = 'proposal_follow_up' or
 * 'proposal_viewed_no_action', find proposals that match the criteria
 * (sent/viewed, past the configured delay, not yet at max follow-ups) and
 * record the follow-up event in the audit log.
 *
 * The actual email dispatch is handled by the notification service; this
 * cron just marks which proposals are eligible and increments their
 * follow-up count.
 */
export async function GET(request: NextRequest) {
  try {
    // --- Verify CRON_SECRET ---
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const supabase = await createServiceClient();

    // 1. Fetch all active follow-up automations
    const { data: automations, error: autoErr } = await supabase
      .from('automations')
      .select()
      .in('trigger_type', ['proposal_follow_up', 'proposal_viewed_no_action'])
      .eq('is_active', true);

    if (autoErr || !automations || automations.length === 0) {
      log.info('No active follow-up automations found, skipping.');
      return NextResponse.json({ processed: 0 });
    }

    let totalProcessed = 0;

    for (const automation of automations) {
      const config = (automation.trigger_config ?? {}) as Record<string, unknown>;
      const delayDays = (config.delayDays as number) ?? 3;
      const maxFollowUps = (config.maxFollowUps as number) ?? 3;
      const orgId = automation.organization_id as string;

      // 2. Find eligible proposals
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - delayDays);

      const statusFilter =
        automation.trigger_type === 'proposal_viewed_no_action'
          ? ['viewed', 'negotiating']
          : ['sent'];

      const { data: proposals } = await supabase
        .from('proposals')
        .select('id, name, status, follow_up_count, client_id')
        .eq('organization_id', orgId)
        .in('status', statusFilter)
        .lt('updated_at', cutoff.toISOString())
        .or(`follow_up_count.is.null,follow_up_count.lt.${maxFollowUps}`);

      if (!proposals || proposals.length === 0) continue;

      for (const proposal of proposals) {
        // 3. Increment follow-up count
        const currentCount = (proposal.follow_up_count as number) ?? 0;
        await supabase
          .from('proposals')
          .update({ follow_up_count: currentCount + 1 })
          .eq('id', proposal.id);

        // 4. Record in audit log
        await supabase.from('audit_log').insert({
          organization_id: orgId,
          entity_type: 'proposal',
          entity_id: proposal.id,
          action: 'follow_up_triggered',
          details: {
            automation_id: automation.id,
            automation_name: automation.name,
            follow_up_number: currentCount + 1,
            trigger_type: automation.trigger_type,
          },
        });

        totalProcessed++;
      }

      // 5. Update automation run stats
      await supabase
        .from('automations')
        .update({
          run_count: ((automation.run_count as number) ?? 0) + (proposals?.length ?? 0),
          last_run_at: new Date().toISOString(),
        })
        .eq('id', automation.id);
    }

    log.info(`Proposal follow-up cron complete. Processed ${totalProcessed} proposals.`);
    return NextResponse.json({ processed: totalProcessed });
  } catch (err) {
    log.error('Proposal follow-up cron error', {}, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
