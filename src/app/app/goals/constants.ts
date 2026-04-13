/** Canonical goal enums — single source of truth for categories and statuses. */

export const GOAL_CATEGORIES = ['Company', 'Department', 'Individual'] as const;
type GoalCategory = (typeof GOAL_CATEGORIES)[number];

export const GOAL_STATUSES = [
  { value: 'on_track', label: 'On Track' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'off_track', label: 'Off Track' },
  { value: 'completed', label: 'Completed' },
] as const;
type GoalStatus = (typeof GOAL_STATUSES)[number]['value'];
