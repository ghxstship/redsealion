import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireCronAuth } from '@/lib/api/cron-guard';
import { checkAutomationTriggers } from '@/lib/automations/trigger';

/**
 * Cron endpoint for task due-date reminders.
 *
 * Creates in-app notifications for:
 * 1. Tasks due today — "Due Today" reminder
 * 2. Tasks overdue (past due date, not done) — "Overdue" alert
 *
 * Also triggers `task_overdue` automation events so org-configured
 * automations (Slack, email, etc.) fire automatically.
 *
 * Schedule: daily at 7 AM UTC
 *   { "path": "/api/cron/task-reminders", "schedule": "0 7 * * *" }
 */
export async function GET(request: Request) {
  const denied = requireCronAuth(request);
  if (denied) return denied;

  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    let notificationsCreated = 0;
    let automationsTriggered = 0;

    // ─── 1. Tasks due today ──────────────────────────────────
    const { data: dueToday } = await supabase
      .from('tasks')
      .select(
        'id, title, organization_id, assignee_id, due_date',
      )
      .eq('due_date', today)
      .not('status', 'eq', 'done')
      .not('status', 'eq', 'cancelled');

    for (const task of dueToday ?? []) {
      if (!task.assignee_id) continue;

      // Create in-app notification
      await supabase.from('notifications').insert({
        user_id: task.assignee_id,
        organization_id: task.organization_id,
        type: 'task_due_today',
        title: 'Task due today',
        message: task.title,
        source_type: 'task',
        source_id: task.id,
        action_url: `/app/tasks/${task.id}`,
        read: false,
      });

      notificationsCreated++;
    }

    // ─── 2. Overdue tasks ────────────────────────────────────
    const { data: overdue } = await supabase
      .from('tasks')
      .select(
        'id, title, organization_id, assignee_id, due_date',
      )
      .lt('due_date', today)
      .not('status', 'eq', 'done')
      .not('status', 'eq', 'cancelled');

    for (const task of overdue ?? []) {
      if (!task.assignee_id) continue;

      const daysOverdue = Math.floor(
        (new Date(today).getTime() - new Date(task.due_date).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      // Only send overdue notifications on day 1, 3, 7 to avoid spam
      if (![1, 3, 7].includes(daysOverdue)) continue;

      // Create in-app notification
      await supabase.from('notifications').insert({
        user_id: task.assignee_id,
        organization_id: task.organization_id,
        type: 'task_overdue',
        title: `Task overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}`,
        message: task.title,
        source_type: 'task',
        source_id: task.id,
        action_url: `/app/tasks/${task.id}`,
        read: false,
      });

      notificationsCreated++;

      // Trigger automation engine (org may have Slack/email webhooks configured)
      try {
        await checkAutomationTriggers('task_overdue', {
          org_id: task.organization_id,
          task_id: task.id,
          task_title: task.title,
          assignee_id: task.assignee_id,
          due_date: task.due_date,
          days_overdue: daysOverdue,
        });
        automationsTriggered++;
      } catch {
        // Automation failures should never block notification delivery
      }
    }

    return NextResponse.json({
      success: true,
      due_today: dueToday?.length ?? 0,
      overdue: overdue?.length ?? 0,
      notifications_created: notificationsCreated,
      automations_triggered: automationsTriggered,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal error processing task reminders.' },
      { status: 500 },
    );
  }
}
