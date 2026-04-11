/**
 * Centralized mapping for status strings to normalized UI columns or states.
 * Eliminates scattered `STATUS_MAP` definitions across components like Kanban boards.
 */

export function mapTaskStatusToColumn(status: string): 'todo' | 'in_progress' | 'review' | 'done' {
  switch (status) {
    case 'not_started':
    case 'blocked':
    case 'todo':
    case 'cancelled':
      return 'todo';
    case 'in_progress':
      return 'in_progress';
    case 'review':
    case 'in_review':
      return 'review';
    case 'done':
      return 'done';
    default:
      return 'todo';
  }
}
