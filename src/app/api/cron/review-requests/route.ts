import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('cron-review-requests');

/**
 * Cron job: send review requests after project completion.
 * Evaluates automations with trigger_type = 'proposal_status_change'
 * and action_type = 'send_review_request', then checks for recently
 * completed proposals that haven't had a review request sent yet.
 */
export async function GET() {
  try {
    const supabase = await createServiceClient();

    // Find all active review request automations
    const { data: automations } = await supabase
      .from('automations')
      .select()
      .eq('action_type', 'send_review_request')
      .eq('is_active', true);

    if (!automations || automations.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    let totalProcessed = 0;

    for (const automation of automations) {
      const actionConfig = (automation.action_config ?? {}) as Record<string, unknown>;
      const delayDays = (actionConfig.delayDays as number) ?? 1;
      const orgId = automation.organization_id as string;

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - delayDays);

      // Find completed proposals that haven't had a review request
      const { data: proposals } = await supabase
        .from('proposals')
        .select('id, name, client_id')
        .eq('organization_id', orgId)
        .eq('status', 'complete')
        .lt('updated_at', cutoff.toISOString());

      if (!proposals || proposals.length === 0) continue;

      for (const proposal of proposals) {
        // Check if review already requested (via audit_log)
        const { data: existing } = await supabase
          .from('audit_log')
          .select('id')
          .eq('entity_id', proposal.id)
          .eq('action', 'review_request_sent')
          .limit(1);

        if (existing && existing.length > 0) continue;

        // Record the review request event
        await supabase.from('audit_log').insert({
          organization_id: orgId,
          entity_type: 'proposal',
          entity_id: proposal.id,
          action: 'review_request_sent',
          details: {
            automation_id: automation.id,
            client_id: proposal.client_id,
            review_url: actionConfig.reviewUrl || null,
          },
        });

        totalProcessed++;
      }

      // Update run stats
      await supabase
        .from('automations')
        .update({
          run_count: ((automation.run_count as number) ?? 0) + totalProcessed,
          last_run_at: new Date().toISOString(),
        })
        .eq('id', automation.id);
    }

    log.info(`Review request cron complete. Processed ${totalProcessed} proposals.`);
    return NextResponse.json({ processed: totalProcessed });
  } catch (err) {
    log.error('Review request cron error', {}, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
