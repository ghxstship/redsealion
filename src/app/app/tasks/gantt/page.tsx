import { TierGate } from '@/components/shared/TierGate';
import GanttChart from '@/components/admin/tasks/GanttChart';

export default function GanttPage() {
  return (
    <TierGate feature="gantt">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Gantt Chart</h1>
        <p className="mt-1 text-sm text-text-secondary">Timeline view of tasks and dependencies.</p>
      </div>

      <GanttChart />
    </TierGate>
  );
}
