import { TierGate } from '@/components/shared/TierGate';
import KanbanBoard from '@/components/admin/tasks/KanbanBoard';
import TasksHubTabs from '../../TasksHubTabs';
import PageHeader from '@/components/shared/PageHeader';

export default function TaskBoardPage() {
  return (
    <TierGate feature="tasks">
      <PageHeader
        title="Task Board"
        subtitle="Drag and drop tasks across columns."
      />

      <TasksHubTabs />

      <KanbanBoard />
    </TierGate>
  );
}
