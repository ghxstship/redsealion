/**
 * Recurring task engine.
 *
 * Processes recurrence rules to generate new task instances automatically.
 * Supports daily, weekly, biweekly, monthly, quarterly, and yearly frequencies.
 *
 * @module lib/recurring-tasks
 */

import type { RecurrenceRule } from '@/types/database';

// ---------------------------------------------------------------------------
// Date calculation
// ---------------------------------------------------------------------------

/**
 * Compute the next occurrence date given a recurrence rule and the last date.
 */
export function computeNextOccurrence(
  rule: RecurrenceRule,
  lastDate: Date,
): Date {
  const next = new Date(lastDate);
  const interval = rule.interval || 1;

  switch (rule.frequency) {
    case 'daily':
      next.setDate(next.getDate() + interval);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7 * interval);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14 * interval);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + interval);
      if (rule.day_of_month) {
        next.setDate(Math.min(rule.day_of_month, daysInMonth(next)));
      }
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3 * interval);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + interval);
      break;
  }

  // Handle day-of-week preference for weekly recurrences
  if (rule.frequency === 'weekly' && rule.days_of_week?.length) {
    const targetDay = rule.days_of_week[0]; // Use first preferred day
    while (next.getDay() !== targetDay) {
      next.setDate(next.getDate() + 1);
    }
  }

  return next;
}

/**
 * Check whether a recurrence rule has reached its end condition.
 */
export function isRecurrenceComplete(rule: RecurrenceRule): boolean {
  // End by date
  if (rule.end_date) {
    return new Date() >= new Date(rule.end_date);
  }
  // End by occurrence count
  if (rule.end_after_occurrences != null && rule.occurrences_created != null) {
    return rule.occurrences_created >= rule.end_after_occurrences;
  }
  // No end condition = infinite
  return false;
}

/**
 * Check whether a new occurrence should be created (i.e., the next date is in the past or today).
 */
function shouldCreateOccurrence(
  rule: RecurrenceRule,
  lastDueDate: string | null,
): boolean {
  if (isRecurrenceComplete(rule)) return false;

  const base = lastDueDate ? new Date(lastDueDate) : new Date();
  const next = computeNextOccurrence(rule, base);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return next <= today;
}

/**
 * Describe a recurrence rule in human-readable form.
 */
function describeRecurrence(rule: RecurrenceRule): string {
  const interval = rule.interval || 1;
  const freq = rule.frequency;

  if (interval === 1) {
    const labels: Record<string, string> = {
      daily: 'Every day',
      weekly: 'Every week',
      biweekly: 'Every 2 weeks',
      monthly: 'Every month',
      quarterly: 'Every quarter',
      yearly: 'Every year',
    };
    return labels[freq] ?? freq;
  }

  const units: Record<string, string> = {
    daily: 'days',
    weekly: 'weeks',
    biweekly: 'weeks',
    monthly: 'months',
    quarterly: 'quarters',
    yearly: 'years',
  };

  return `Every ${interval} ${units[freq] ?? freq}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}
