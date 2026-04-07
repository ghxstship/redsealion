'use client';

/**
 * Task list grouping — group-by dropdown changing how tasks
 * are organized in the table view.
 *
 * @module components/admin/tasks/TaskGrouping
 */

import FormSelect from '@/components/ui/FormSelect';
import { formatLabel } from '@/lib/utils';

const GROUP_OPTIONS = [
  'none',
  'status',
  'priority',
  'assignee',
  'project',
  'due_date',
] as const;

export type GroupBy = (typeof GROUP_OPTIONS)[number];

interface TaskGroupingProps {
  groupBy: GroupBy;
  onChange: (value: GroupBy) => void;
}

export default function TaskGrouping({ groupBy, onChange }: TaskGroupingProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-muted">Group by</span>
      <FormSelect
        value={groupBy}
        onChange={(e) => onChange(e.target.value as GroupBy)}
        className="!py-1 !text-xs w-32"
      >
        {GROUP_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt === 'none' ? 'No grouping' : formatLabel(opt)}
          </option>
        ))}
      </FormSelect>
    </div>
  );
}
