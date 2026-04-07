import { TierGate } from '@/components/shared/TierGate';
import GanttChart from '@/components/admin/tasks/GanttChart';
import TasksHubTabs from '../../TasksHubTabs';
import PageHeader from '@/components/shared/PageHeader';

export default function GanttPage() {
  return (
    <TierGate feature="gantt">
      <PageHeader
        title="Gantt Chart"
        subtitle="Timeline view of tasks and dependencies."
      />

      <TasksHubTabs />

      <GanttChart />
    </TierGate>
  );
}
