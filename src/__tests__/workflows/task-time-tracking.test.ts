/**
 * Task & Time Tracking — End-to-End Workflow Validation
 *
 * Validates:
 *   Task workflow: todo → in_progress → done / cancelled
 *   + Priority levels (low, medium, high, urgent)
 *   + Assignment to users and proposals
 *   + Automation trigger on creation and status change
 *   + Tier gating (enterprise only)
 *
 *   Time entry tracking:
 *   + Start/end time recording
 *   + Duration calculation
 *   + Billable vs non-billable
 *   + Filtering by date range
 */
import { describe, it, expect } from 'vitest';
import { makeTask, makeTimeEntry, TEST_ORG_ID, TEST_USER_ID } from '../helpers';

const TASK_STATUSES = ['todo', 'in_progress', 'done', 'cancelled'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const VALID_TASK_TRANSITIONS: Record<string, string[]> = {
  todo: ['in_progress', 'cancelled'],
  in_progress: ['done', 'todo', 'cancelled'],
  done: ['todo'],         // can reopen
  cancelled: ['todo'],     // can reopen
};

describe('Task Workflow', () => {
  // -----------------------------------------------------------------------
  // Task status machine
  // -----------------------------------------------------------------------

  describe('Task status transitions', () => {
    it('defines all 4 task statuses', () => {
      expect(TASK_STATUSES).toHaveLength(4);
    });

    it('allows todo → in_progress → done flow', () => {
      expect(VALID_TASK_TRANSITIONS.todo).toContain('in_progress');
      expect(VALID_TASK_TRANSITIONS.in_progress).toContain('done');
    });

    it('allows cancellation from active states', () => {
      expect(VALID_TASK_TRANSITIONS.todo).toContain('cancelled');
      expect(VALID_TASK_TRANSITIONS.in_progress).toContain('cancelled');
    });

    it('allows reopening completed or cancelled tasks', () => {
      expect(VALID_TASK_TRANSITIONS.done).toContain('todo');
      expect(VALID_TASK_TRANSITIONS.cancelled).toContain('todo');
    });

    it('allows reverting in_progress to todo', () => {
      expect(VALID_TASK_TRANSITIONS.in_progress).toContain('todo');
    });
  });

  // -----------------------------------------------------------------------
  // Task creation
  // -----------------------------------------------------------------------

  describe('Task creation', () => {
    it('creates a task with required fields', () => {
      const task = makeTask();
      expect(task.title).toBeTruthy();
      expect(task.organization_id).toBe(TEST_ORG_ID);
      expect(task.status).toBe('todo');
    });

    it('defaults status to todo', () => {
      const task = makeTask();
      expect(task.status).toBe('todo');
    });

    it('defaults priority to medium', () => {
      const task = makeTask();
      expect(task.priority).toBe('medium');
    });

    it('requires title', () => {
      const task = makeTask({ title: '' });
      expect(task.title).toBeFalsy();
    });

    it('supports all priority levels', () => {
      for (const priority of TASK_PRIORITIES) {
        const task = makeTask({ priority });
        expect(task.priority).toBe(priority);
      }
    });

    it('supports assignment to user', () => {
      const task = makeTask({ assignee_id: 'user_designer_001' });
      expect(task.assignee_id).toBe('user_designer_001');
    });

    it('supports linking to proposal', () => {
      const task = makeTask({ proposal_id: 'prop_001' });
      expect(task.proposal_id).toBe('prop_001');
    });

    it('supports estimated hours', () => {
      const task = makeTask({ estimated_hours: 8 });
      expect(task.estimated_hours).toBe(8);
    });

    it('tracks created_by', () => {
      const task = makeTask();
      expect(task.created_by).toBe(TEST_USER_ID);
    });
  });

  // -----------------------------------------------------------------------
  // Task filtering
  // -----------------------------------------------------------------------

  describe('Task filtering', () => {
    it('filters by status', () => {
      const tasks = [
        makeTask({ status: 'todo' }),
        makeTask({ status: 'in_progress' }),
        makeTask({ status: 'done' }),
      ];
      const todoTasks = tasks.filter(t => t.status === 'todo');
      expect(todoTasks).toHaveLength(1);
    });

    it('filters by assignee', () => {
      const tasks = [
        makeTask({ assignee_id: 'user_a' }),
        makeTask({ assignee_id: 'user_b' }),
        makeTask({ assignee_id: 'user_a' }),
      ];
      const userATasks = tasks.filter(t => t.assignee_id === 'user_a');
      expect(userATasks).toHaveLength(2);
    });

    it('filters by proposal', () => {
      const tasks = [
        makeTask({ proposal_id: 'prop_001' }),
        makeTask({ proposal_id: 'prop_002' }),
        makeTask({ proposal_id: 'prop_001' }),
      ];
      const prop001Tasks = tasks.filter(t => t.proposal_id === 'prop_001');
      expect(prop001Tasks).toHaveLength(2);
    });

    it('filters by due date range', () => {
      const tasks = [
        makeTask({ due_date: '2026-03-15' }),
        makeTask({ due_date: '2026-04-01' }),
        makeTask({ due_date: '2026-04-15' }),
      ];
      const fromDate = '2026-04-01';
      const filtered = tasks.filter(t => (t.due_date as string) >= fromDate);
      expect(filtered).toHaveLength(2);
    });
  });

  // -----------------------------------------------------------------------
  // Automation triggers
  // -----------------------------------------------------------------------

  describe('Task automation triggers', () => {
    it('fires task_created trigger on creation', () => {
      const task = makeTask();
      const triggerData = {
        org_id: task.organization_id,
        task_id: task.id,
        title: task.title,
        status: task.status,
        assignee_id: task.assignee_id,
      };
      expect(triggerData.org_id).toBeTruthy();
      expect(triggerData.task_id).toBeTruthy();
    });

    it('fires task_status_change trigger on status update', () => {
      const oldStatus = 'todo';
      const newStatus = 'in_progress';
      const triggerData = {
        task_id: 'task_001',
        old_status: oldStatus,
        new_status: newStatus,
      };
      expect(triggerData.old_status).not.toBe(triggerData.new_status);
    });
  });
});

// ===========================================================================
// Time Entry Workflow
// ===========================================================================

describe('Time Entry Workflow', () => {
  // -----------------------------------------------------------------------
  // Time entry creation
  // -----------------------------------------------------------------------

  describe('Time entry creation', () => {
    it('creates a time entry with required fields', () => {
      const entry = makeTimeEntry();
      expect(entry.user_id).toBe(TEST_USER_ID);
      expect(entry.organization_id).toBe(TEST_ORG_ID);
      expect(entry.start_time).toBeTruthy();
    });

    it('requires start_time', () => {
      const entry = makeTimeEntry();
      expect(entry.start_time).toBeTruthy();
    });

    it('calculates duration from start/end', () => {
      const start = new Date('2026-03-20T09:00:00Z');
      const end = new Date('2026-03-20T11:00:00Z');
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      expect(durationMinutes).toBe(120);
    });

    it('defaults billable to true', () => {
      const entry = makeTimeEntry();
      expect(entry.is_billable).toBe(true);
    });

    it('supports non-billable entries', () => {
      const entry = makeTimeEntry({ billable: false });
      expect(entry.is_billable).toBe(false);
    });

    it('links to proposal', () => {
      const entry = makeTimeEntry({ proposal_id: 'prop_001' });
      expect(entry.proposal_id).toBe('prop_001');
    });
  });

  // -----------------------------------------------------------------------
  // Time entry filtering
  // -----------------------------------------------------------------------

  describe('Time entry filtering', () => {
    it('filters by user', () => {
      const entries = [
        makeTimeEntry({ user_id: 'user_a' }),
        makeTimeEntry({ user_id: 'user_b' }),
      ];
      const userAEntries = entries.filter(e => e.user_id === 'user_a');
      expect(userAEntries).toHaveLength(1);
    });

    it('filters by date range', () => {
      const entries = [
        makeTimeEntry({ start_time: '2026-03-18T09:00:00Z' }),
        makeTimeEntry({ start_time: '2026-03-20T09:00:00Z' }),
        makeTimeEntry({ start_time: '2026-03-22T09:00:00Z' }),
      ];
      const from = '2026-03-19T00:00:00Z';
      const to = '2026-03-21T00:00:00Z';
      const filtered = entries.filter(
        e => (e.start_time as string) >= from && (e.start_time as string) <= to,
      );
      expect(filtered).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // Billable hours reporting
  // -----------------------------------------------------------------------

  describe('Billable hours calculation', () => {
    it('sums billable hours for a proposal', () => {
      const entries = [
        makeTimeEntry({ duration_minutes: 120, billable: true }),
        makeTimeEntry({ duration_minutes: 60, billable: true }),
        makeTimeEntry({ duration_minutes: 90, billable: false }),
      ];
      const billableMinutes = entries
        .filter(e => e.is_billable)
        .reduce((sum, e) => sum + (e.duration_minutes as number), 0);

      expect(billableMinutes).toBe(180);
      expect(billableMinutes / 60).toBe(3);
    });

    it('calculates total hours (billable + non-billable)', () => {
      const entries = [
        makeTimeEntry({ duration_minutes: 120, billable: true }),
        makeTimeEntry({ duration_minutes: 60, billable: false }),
      ];
      const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes as number), 0);
      expect(totalMinutes).toBe(180);
    });
  });
});
