import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { computeNextOccurrence, isRecurrenceComplete } from '@/lib/recurring-tasks';
import { requireCronAuth } from '@/lib/api/cron-guard';
import type { RecurrenceRule } from '@/types/database';

/**
 * Cron endpoint for processing recurring tasks.
 *
 * Called daily by Vercel Cron. For each organization, finds active recurring tasks
 * whose next occurrence is due and creates new task instances.
 *
 * Vercel Cron config should  be added to vercel.json:
 *   { "path": "/api/cron/recurring-tasks", "schedule": "0 6 * * *" }
 */
export async function GET(request: Request) {
  // --- Verify CRON_SECRET (centralized SSOT guard) ---
  const denied = requireCronAuth(request);
  if (denied) return denied;

  try {
    const supabase = await createClient();

    // Find all tasks with recurrence rules
    const { data: recurringTasks, error } = await supabase
      .from('tasks')
      .select('*')
      .not('recurrence_rule', 'is', null)
      .is('parent_task_id', null) // Only process parent (non-subtask) recurring tasks
      .in('status', ['todo', 'in_progress', 'done']); // Skip cancelled/blocked

    if (error || !recurringTasks) {
      return NextResponse.json({ error: 'Failed to query tasks', details: error?.message }, { status: 500 });
    }

    let created = 0;

    for (const task of recurringTasks) {
      const rule = task.recurrence_rule as RecurrenceRule | null;
      if (!rule) continue;
      if (isRecurrenceComplete(rule)) continue;

      // Compute the next date based on the original task's due date
      const lastDate = task.due_date ? new Date(task.due_date) : new Date(task.created_at);
      const nextDate = computeNextOccurrence(rule, lastDate);

      // Only create if next date is today or in the past
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (nextDate > today) continue;

      // Create a new task instance
      const { error: insertError } = await supabase
        .from('tasks')
        .insert({
          organization_id: task.organization_id,
          proposal_id: task.proposal_id,
          phase_id: task.phase_id,
          parent_task_id: null,
          title: task.title,
          description: task.description,
          status: 'todo',
          priority: task.priority,
          assignee_id: task.assignee_id,
          due_date: nextDate.toISOString().split('T')[0],
          start_date: null,
          estimated_hours: task.estimated_hours,
          recurrence_rule: null, // New tasks are not themselves recurring
          recurring_parent_id: task.id,
          created_by: task.created_by,
          sort_order: 0,
        });

      if (!insertError) {
        created++;

        // Update the parent's recurrence rule occurrence count
        const updatedRule: RecurrenceRule = {
          ...rule,
          occurrences_created: (rule.occurrences_created ?? 0) + 1,
        };

        await supabase
          .from('tasks')
          .update({
            recurrence_rule: updatedRule,
            due_date: nextDate.toISOString().split('T')[0],
          })
          .eq('id', task.id);
      }
    }

    return NextResponse.json({
      success: true,
      tasks_processed: recurringTasks.length,
      tasks_created: created,
    });
  } catch {
    return NextResponse.json({ error: 'Internal error processing recurring tasks.' }, { status: 500 });
  }
}
