import { TierGate } from '@/components/shared/TierGate';
import GanttChart from '@/components/admin/tasks/GanttChart';
import TaskViewSwitcher from '@/components/admin/tasks/TaskViewSwitcher';

export default function GanttPage() {
  return (
    <TierGate feature="gantt">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Gantt Chart</h1>
          <p className="mt-1 text-sm text-text-secondary">Timeline view of tasks and dependencies.</p>
        </div>
        <TaskViewSwitcher />
      </div>

      <GanttChart />
    </TierGate>
  );
}
