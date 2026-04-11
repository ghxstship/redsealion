/**
 * Shared schedule constants — single source of truth for schedule types and labels.
 * Used by schedule/new, schedule/(hub)/page.tsx, and ScheduleHubTabs.
 */

export const SCHEDULE_TYPES = [
  { value: 'build_strike', label: 'Build & Strike' },
  { value: 'run_of_show', label: 'Run of Show' },
  { value: 'rehearsal', label: 'Rehearsal' },
  { value: 'general', label: 'General' },
] as const;

export const SCHEDULE_TYPE_LABELS: Record<string, string> = {
  build_strike: 'Build & Strike',
  run_of_show: 'Run of Show',
  rehearsal: 'Rehearsal',
  general: 'General',
};

export type ScheduleType = (typeof SCHEDULE_TYPES)[number]['value'];
