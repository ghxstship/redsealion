import { TierGate } from '@/components/shared/TierGate';
import KanbanBoard from '@/components/admin/tasks/KanbanBoard';
import TaskViewSwitcher from '@/components/admin/tasks/TaskViewSwitcher';

export default function TaskBoardPage() {
  return (
    <TierGate feature="tasks">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Task Board</h1>
          <p className="mt-1 text-sm text-text-secondary">Drag and drop tasks across columns.</p>
        </div>
        <TaskViewSwitcher />
      </div>

      <KanbanBoard />
    </TierGate>
  );
}
