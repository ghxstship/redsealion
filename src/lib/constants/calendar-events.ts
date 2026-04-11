/**
 * Calendar event type visual constants.
 * Extracted from the calendar page to provide a single source of truth
 * for event type colors and labels across the platform.
 */

export const CALENDAR_EVENT_COLORS: Record<string, string> = {
  event: 'bg-rose-100 text-rose-800 border-rose-200',
  proposal: 'bg-blue-100 text-blue-800 border-blue-200',
  venue_activation: 'bg-purple-100 text-purple-800 border-purple-200',
  crew_booking: 'bg-green-100 text-green-800 border-green-200',
  task: 'bg-amber-100 text-amber-800 border-amber-200',
};

export const CALENDAR_EVENT_LABELS: Record<string, string> = {
  event: 'Event',
  proposal: 'Proposal',
  venue_activation: 'Activation',
  crew_booking: 'Crew',
  task: 'Task',
};
