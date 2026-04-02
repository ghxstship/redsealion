import { TierGate } from '@/components/shared/TierGate';
import KanbanBoard from '@/components/admin/tasks/KanbanBoard';

export default function TaskBoardPage() {
  return (
    <TierGate feature="tasks">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Task Board</h1>
        <p className="mt-1 text-sm text-text-secondary">Drag and drop tasks across columns.</p>
      </div>

      <KanbanBoard />
    </TierGate>
  );
}
