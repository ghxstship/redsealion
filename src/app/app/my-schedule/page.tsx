import EmptyState from '@/components/ui/EmptyState';
import { Calendar } from 'lucide-react';

export default function MySchedulePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          My Schedule
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          View your upcoming shifts, calls, and deadlines.
        </p>
      </div>

      <EmptyState
        icon={<Calendar className="w-8 h-8" />}
        message="Your schedule is clear"
        description="Your personalized calendar view is currently being configured."
      />
    </div>
  );
}
