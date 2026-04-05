import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireFeature } from '@/lib/api/tier-guard';
import { requirePermission } from '@/lib/api/permission-guard';
import { sendEmail } from '@/lib/email';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

interface ActionResult {
  action_type: string;
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
}

async function executeAction(
  automation: Record<string, unknown>,
  triggerData: Record<string, unknown>,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<ActionResult> {
  const actionType = automation.action_type as string;
  const actionConfig = (automation.action_config ?? {}) as Record<string, unknown>;

  switch (actionType) {
    case 'send_email': {
      const recipient = (actionConfig.recipient ?? actionConfig.to) as string | undefined;
      if (!recipient) {
        return { action_type: actionType, success: false, error: 'No recipient configured' };
      }
      const subject = (actionConfig.subject as string) ?? `Automation: ${automation.name}`;
      const body =
        (actionConfig.body as string) ??
        `Automation "${automation.name}" was triggered.\n\nTrigger data: ${JSON.stringify(triggerData, null, 2)}`;

      const result = await sendEmail({ to: recipient, subject, body });
      return {
        action_type: actionType,
        success: result.success,
        message: result.success ? `Email sent to ${recipient}` : undefined,
        data: { messageId: result.messageId },
        error: result.error,
      };
    }

    case 'send_slack': {
      const channel = (actionConfig.channel as string) ?? '#general';
      const message =
        (actionConfig.message as string) ??
        `Automation "${automation.name}" triggered with data: ${JSON.stringify(triggerData)}`;

      // Slack integration not configured — record attempt without sending
      void channel;
      void message;
      return {
        action_type: actionType,
        success: true,
        message: `Slack message logged for ${channel} (no token configured)`,
        data: { channel, message },
      };
    }

    case 'create_invoice': {
      const proposalId = (triggerData.proposal_id ?? actionConfig.proposal_id) as string | undefined;
      const clientId = (triggerData.client_id ?? actionConfig.client_id) as string | undefined;
      const amount = (triggerData.amount ?? actionConfig.amount) as number | undefined;

      if (!clientId) {
        return { action_type: actionType, success: false, error: 'No client_id provided' };
      }

      const orgId = automation.organization_id as string;
      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          organization_id: orgId,
          client_id: clientId,
          proposal_id: proposalId ?? null,
          amount: amount ?? 0,
          status: 'draft',
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        return { action_type: actionType, success: false, error: error.message };
      }
      return {
        action_type: actionType,
        success: true,
        message: `Draft invoice created`,
        data: { invoice_id: invoice.id },
      };
    }

    case 'update_status': {
      const entityType = (actionConfig.entity_type as string) ?? 'proposals';
      const entityId = (triggerData.entity_id ?? actionConfig.entity_id) as string | undefined;
      const newStatus = (actionConfig.status ?? actionConfig.new_status) as string | undefined;

      if (!entityId || !newStatus) {
        return {
          action_type: actionType,
          success: false,
          error: 'Missing entity_id or status in config/trigger_data',
        };
      }

      const table = entityType === 'deal' || entityType === 'deals' ? 'deals' : 'proposals';
      const { error } = await supabase
        .from(table)
        .update({ status: newStatus })
        .eq('id', entityId);

      if (error) {
        return { action_type: actionType, success: false, error: error.message };
      }
      return {
        action_type: actionType,
        success: true,
        message: `Updated ${table} ${entityId} status to "${newStatus}"`,
      };
    }

    case 'webhook': {
      const url = actionConfig.url as string | undefined;
      if (!url) {
        return { action_type: actionType, success: false, error: 'No webhook URL configured' };
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(triggerData),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const responseBody = await response.text().catch(() => '');
        return {
          action_type: actionType,
          success: response.ok,
          message: `Webhook ${response.ok ? 'delivered' : 'failed'} (${response.status})`,
          data: { status: response.status, body: responseBody.slice(0, 1000) },
        };
      } catch (err) {
        clearTimeout(timeout);
        const message = err instanceof Error ? err.message : 'Unknown error';
        return {
          action_type: actionType,
          success: false,
          error: `Webhook request failed: ${message}`,
        };
      }
    }

    default:
      return {
        action_type: actionType,
        success: false,
        error: `Unknown action type: ${actionType}`,
      };
  }
}

export async function POST(request: NextRequest) {
  try {
    const tierError = await requireFeature('automations');
    if (tierError) return tierError;

    const permError = await requirePermission('automations', 'edit');
    if (permError) return permError;

    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = ctx.organizationId;

    const body = await request.json();
    const automationId: string | undefined = body.automationId;
    const triggerData: Record<string, unknown> = body.triggerData ?? {};

    if (!automationId) {
      return NextResponse.json({ error: 'Automation ID required' }, { status: 400 });
    }

    // Fetch the automation
    const { data: automation } = await supabase
      .from('automations')
      .select()
      .eq('id', automationId)
      .eq('organization_id', orgId)
      .single();

    if (!automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    if (!automation.is_active) {
      return NextResponse.json({ error: 'Automation is inactive' }, { status: 400 });
    }

    // Create a run record
    const { data: run } = await supabase
      .from('automation_runs')
      .insert({
        automation_id: automationId,
        organization_id: orgId,
        status: 'running',
        trigger_data: triggerData,
      })
      .select('id')
      .single();

    // Execute the action
    let result: ActionResult;
    try {
      result = await executeAction(automation, triggerData, supabase);
    } catch (err) {
      result = {
        action_type: (automation.action_type as string) ?? 'unknown',
        success: false,
        error: err instanceof Error ? err.message : 'Unexpected execution error',
      };
    }

    // Update the run record with actual result
    if (run) {
      await supabase
        .from('automation_runs')
        .update({
          status: result.success ? 'completed' : 'failed',
          result,
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id);
    }

    // Increment run count
    await supabase
      .from('automations')
      .update({
        run_count: (automation.run_count ?? 0) + 1,
        last_run_at: new Date().toISOString(),
      })
      .eq('id', automationId);

    return NextResponse.json({
      success: result.success,
      automationId,
      runId: run?.id,
      result,
    });
  } catch (error) {
    const { createLogger } = await import('@/lib/logger');
    createLogger('automations').error('Automation run error', {}, error);
    return NextResponse.json({ error: 'Automation execution failed' }, { status: 500 });
  }
}
