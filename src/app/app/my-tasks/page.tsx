import EmptyState from '@/components/ui/EmptyState';
import { CheckCircle2 } from 'lucide-react';

export default function MyTasksPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          My Tasks
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Track your assigned tasks and pending approvals.
        </p>
      </div>

      <EmptyState
        icon={<CheckCircle2 className="w-8 h-8" />}
        message="No pending tasks"
        description="Your personal task inbox and approval queue is currently being configured."
      />
    </div>
  );
}
